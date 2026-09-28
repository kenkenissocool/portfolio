"""Reconstruct a closed 3D sculpture from the approved artwork's silhouette.
Offline tool: numpy, scipy, Pillow, scikit-image 0.25.2.
Reflection detail is retained as a UV texture; the mesh has real thickness,
folds, openings, normals, lighting and coherent animated deformation.
"""
from pathlib import Path
import struct
import numpy as np
from PIL import Image
from scipy.ndimage import label, distance_transform_edt, gaussian_filter, map_coordinates
from scipy.sparse import coo_matrix
from scipy.sparse.csgraph import connected_components
from skimage.measure import marching_cubes

root=Path(__file__).resolve().parent.parent
image=Image.open(root/'assets/chrome-sculpture.png')
# The source's disconnected glow/spark pixels are not structural geometry.
width=680; height=round(width*image.height/image.width)
alpha=np.asarray(image.resize((width,height),Image.Resampling.LANCZOS))[:,:,3]
mask=alpha>145
labels,_=label(mask); sizes=np.bincount(labels.ravel());sizes[0]=0
mask=labels==np.argmax(sizes)
# Padding closes points cut off at the edges of the original composition.
mask=np.pad(mask,3)
step=(image.width/150)/width
signed=(distance_transform_edt(~mask)-distance_transform_edt(mask))*step
signed=gaussian_filter(signed,.65).astype(np.float32)
ys,xs=np.indices(mask.shape)
x=((xs-3)/width*image.width-1095)/150
y=(480-(ys-3)/width*image.width)/150
mid=(.30*np.sin(x*1.45-y*1.05)+.10*np.sin(x*2.6+y*2.2))*np.exp(-np.hypot(x,y)*.15)
# Rounded lens sections meet exactly at the source silhouette. A spatial fold
# gives broad saddles and depth while preserving the approved outline.
zvalues=np.arange(-1.35,1.35+.035,.035,dtype=np.float32)
field=((zvalues[None,None,:]-mid[:,:,None])**2 + .45*signed[:,:,None]).astype(np.float32)
vertices,faces,_,_=marching_cubes(field,0,spacing=(step,step,.035),allow_degenerate=False,step_size=2)
coords=(vertices/np.array([step,step,.035])).T
normals=np.column_stack([map_coordinates(g,coords,order=1,mode='nearest') for g in np.gradient(field,step,step,.035)])
# Marching-cubes axes are image Y, image X, depth. Convert to world XYZ.
positions=np.column_stack([vertices[:,1]-3*step-1095/150,480/150-(vertices[:,0]-3*step),vertices[:,2]+zvalues[0]])
normals=np.column_stack([normals[:,1],-normals[:,0],normals[:,2]])
normals/=np.maximum(np.linalg.norm(normals,axis=1,keepdims=True),1e-8)
uv=np.column_stack([(positions[:,0]*150+1095)/image.width,1-(480-positions[:,1]*150)/image.height])
# Keep the connected sculpture, omitting any sub-voxel extraction remnants.
edges0=np.concatenate([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]])
adj=coo_matrix((np.ones(len(edges0)),(edges0[:,0],edges0[:,1])),shape=(len(positions),len(positions)))
_,components=connected_components(adj,directed=False)
body=np.argmax(np.bincount(components))
faces=faces[(components[faces]==body).all(axis=1)]
used=np.unique(faces);remap=np.full(len(positions),-1,dtype=np.int32);remap[used]=np.arange(len(used))
positions=positions[used];normals=normals[used];uv=uv[used];faces=remap[faces]
a,b,c=positions[faces[:,0]],positions[faces[:,1]],positions[faces[:,2]]
assert np.isfinite(positions).all()
assert np.min(np.linalg.norm(np.cross(b-a,c-a),axis=1))>1e-14
edges=np.sort(np.concatenate([faces[:,[0,1]],faces[:,[1,2]],faces[:,[2,0]]]),axis=1)
unique,counts=np.unique(edges,axis=0,return_counts=True)
assert np.all(counts==2), 'open/non-manifold mesh'
adj=coo_matrix((np.ones(len(unique)),(unique[:,0],unique[:,1])),shape=(len(positions),len(positions)))
assert connected_components(adj,directed=False)[0]==1
volume=np.sum(np.einsum('ij,ij->i',a,np.cross(b,c)))/6
if volume<0:faces=faces[:,::-1]
chi=len(positions)-len(unique)+len(faces)
assert chi<=2 and chi%2==0
out=root/'assets/models/liquid-sculpture.bin'
with out.open('wb') as f:
    f.write(struct.pack('<4sII',b'LQD4',len(positions),len(faces)*3))
    f.write(positions.astype('<f4').tobytes())
    f.write((normals*32767).round().astype('<i2').tobytes())
    f.write((np.clip(uv,0,1)*65535).round().astype('<u2').tobytes())
    assert len(positions)<65536
    f.write(faces.astype('<u2').tobytes())
print(f'{len(positions)} vertices; {len(faces)} triangles; watertight single mesh; {(2-chi)//2} apertures; {out.stat().st_size} bytes')
