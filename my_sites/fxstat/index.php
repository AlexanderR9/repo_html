<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<meta http-equiv="Cache-Control" content="no-cache">
	<meta http-equiv="Cache-Control" content="private">
	<meta http-equiv="Cache-Control" content="max-age=10800, must-revalidate">
	<meta http-equiv="Cache-Control" content="max-age=10800, proxy-revalidate">
	
	<title>FX statistic</title>

	<?php
    include('phplib/common.php');
    include('phplib/fileworker.php');
	include('php/includes.php');
    ?>
	
</head>
<body>
    
    <?php include('html/header.html'); ?>
	
	
		<!-- content block -->
	<div id="center_div" class="main_params_size flex_parent_div">
	</div>

    <?php include('html/footer.html'); ?>
	
	
	
	<button style="text-align: center; width: 100px" onclick="btn_jsfunc()">JS</button>
	
	<button style="text-align: center; width: 100px">
		<a href="php/db_test.php">PHP</a>
	</button>
	
    <script>
		function btn_jsfunc()
		{
			var e = document.getElementById('center_div'); 
			e.innerHTML += '<p>clicked!</p>';
			 //alert("Отправка разрешена");
			 console.log("clicked!");
		}
	</script>

    <!--
    <script type="text/javascript">
        var jsArray = php echo json_encode($arr_stocks); ?>;
        var e = document.getElementById('sidebar_list'); 
        e.innerHTML += '<p>arr size:'+jsArray.length+'</p>';
        for (var i=0; i<jsArray.length; i++)
        {
            var s = `<p>${jsArray[i]}</p>`;
            e.innerHTML += s;
        }
    </script>
    -->
    

</body>
</html>