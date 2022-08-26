$('a[href*="#"]').click(function () {
	var elmHash = $(this).attr('href'); 
	var pos = $(elmHash).offset().top;	
	$('body,html').animate({scrollTop: pos}, 500); 
	return false;
});

$(function(){
  $('.menu-trigger').on('click', function() {
    $(this).toggleClass('active');
    return false;
  });
});

$(function(){
  $("#pt-5 a").click(function() {
    $("input:checkbox").prop("checked",false);
  });
});