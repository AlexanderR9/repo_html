<!DOCTYPE html>
<html lang="ru">
<head>
	<title>Database editor</title>
	
	<?php 
		include('../php/includes.php'); 
		include('../php/db_editor_leftbar.php');
		include('../php/db_editor_centerdiv.php');
		//include('../php/db_new_table.php');
	?>	
	
	<script src="../js/lcommon.js"></script>
	<script src="../js/ltable.js"></script>
	<script src="../js/lajax.js"></script>
	<script type="text/javascript" src="../js/db_remove_table.js"></script>
	<script type="text/javascript" src="../js/db_new_table.js"></script>
	
	
</head>
<body>

    <?php 
		//include('../html/header.html'); 
		

		//create page title
		$title = new HText("   Database:   ".AppSettings::dbName());
		$title->setMargin(-1, -1, 10, -1, 'px');
		$title->setDisplayMode(HDisplayMode::hdmBlock);
		$title->setBorder(2, 'green');
		$title->setFont(22, 'SteelBlue');
		$title->setFontBoldItalic(true, true);
		$title->addClass('main_params_size');
		$title->place();
		
		//create main_div
		$main_div = new HFlexDiv('db_main_div');
		//$main_div->setID("db_main_div");
		$main_div->setMargin(-1, -1, 10, -1);
		$main_div->addClass('main_params_size');
		$main_div->setTransparent(true);
		$main_div->addChild(new DBEditorLeftbar(20));			
//		$main_div->addChild(new DB_NewTableDiv(78));			
//		$main_div->addChild(new DBEditorCenterDiv(78));			
		$main_div->place();

		
	?> <!-- END PHP -->


 
	<script>
		let div = document.getElementById("db_main_div");	
		if (div)
		{
			console.log("childElementCount ", div.childElementCount);
			if (div.childElementCount == 1)
			{
				try 
				{
					let c_div = `<?php $el = new DBEditorCenterDiv(78); $el->place(); ?>`;
					div.insertAdjacentHTML('beforeend', c_div);
				} 
				catch (err) 
				{
					var h2 = document.createElement("h4");
					h2.appendChild(document.createTextNode(err));
					h2.setAttribute('style', 'color:red');
					document.body.appendChild(h2);
				}
			}
			console.log("childElementCount ", div.childElementCount);
		}
		else 
		{
			var h2 = document.createElement("h2");
			h2.appendChild(document.createTextNode("ERROR: main_div not found"));
			h2.setAttribute('style', 'color:red');
			document.body.appendChild(h2);
		}			
	</script>
	
		
		
</body>
</html>


