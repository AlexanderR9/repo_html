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
	include('php/index_content.php');
    ?>
	
</head>
<body>
    
	
	
		<!-- content block 
    <?php include('html/header.html'); ?>
		
		
		
		style="background-color: white; min-height: 130px; font-family: 'Literata';"
		-->
	<div id="center_div" class="main_params_size">
		<div>
		
		
		<?php 
			echo $_SERVER['SERVER_NAME'];  br(); 
			echo_br(root_path());
			echo_br(pwd());
			echo_br(basename(__FILE__));
			echo_br("ТРАМ   ПАМПАММММ");
		?>
		</div>
		<div style="background-color: Gainsboro; min-height: 130px; margin-top: 20px">
		<?php 
			$hdiv = new HDiv();
			$hdiv->setMargin(100, 20, -1, -1);
			$hdiv->setWidth(60, -1, -1, '%');
			$hdiv->setPadding(-1, -1, 25, -1);
			$hdiv->setHeight(160, -1, -1, 'px');			
			$hdiv->setBorderParams(4, "ForestGreen");
			$hdiv->setFontTextColor("DarkSlateGray");
			$hdiv->setFontBoldItalic(true, false);
			//$hdiv->setFontSize(22);
			$hdiv->setFontAlign(HAlign::haCenter);
			$hdiv->placeObject();
		
		?>
		</div>
		<div style="background-color: white; min-height: 130px; margin-top: 20px">
		</div>	
	</div>

    <?php include('html/footer.html'); ?>
	
	
	
	<button style="text-align: center; width: 100px; font-style: ;  font-size: 18px" onclick="btn_jsfunc()">JS</button>
	
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