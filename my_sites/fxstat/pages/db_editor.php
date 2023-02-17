<!DOCTYPE html>
<html lang="ru">
<head>
	<?php include('../php/includes.php'); ?>	
	<title>Database editor</title>
	
	<?php include('../php/db_editor_leftbar.php'); ?>
	<?php include('../php/db_editor_centerdiv.php'); ?>
	
	<script type="text/javascript" src="../js/lajax.js"></script>
	<script type="text/javascript" src="../js/db_remove_table.js"></script>
	<script type="text/javascript" src="../js/db_new_table.js"></script>
	
	
</head>
<body>

    <?php 
		include('../html/header.html'); 
		

		//create page title
		/*
		$title = new HText("Database:   ".$db->dbName());
		$title->setMargin(-1, -1, 20, -1);
		$title->setDisplayMode(HDisplayMode::hdmBlock);
		$title->setBorder(1);
		$title->setFontTextColor('SteelBlue');
		$title->setFontSize(22);
		$title->setFontBoldItalic(true, true);
		$title->addClass('main_params_size');
		$title->place();
		*/
		
		//create main_div
		$main_div = new HFlexDiv();
		$main_div->setID("db_main_div");
		//$main_div->setBorder(1, 'green');
		$main_div->setMargin(-1, -1, 10, -1);
		$main_div->addClass('main_params_size');
		$main_div->setTransparent(true);
		$main_div->addChild(new DBEditorLeftbar(20));			
//		$main_div->addChild(new DBEditorCenterDiv(78));			

		//test btn
		$btn = new HButton("test");
		$btn->setID("test_btn");
		$btn->setBorder(5, 'blue');
		//$main_div->addChild($btn);			
		//place content    $center_div->place();   HText("HText element");
		$main_div->place();
		
		include('../php/db_new_table.php'); 

		
		/*
		//group box
		$box = new HGroupBox('Group box title');
		$box->setWidth(20, -1, -1, '%');
		$main_div->addChild($box);
		//combo box
		$cb = new HComboBox();
		$cb->addItem(105, "item 1");
		$cb->addItem(107, "item 2");
		$cb->addItem(27, "item 3");
		$cb->setFontTextColor('SteelBlue');
		$main_div->addChild($cb);
		//line edit
		$main_div->addChild(new HLineEdit("lineedit textttt"));		
		//check box
		$check = new HCheckBlock("CheckBlock caption");
		//$check->setWidth(300, -1, -1, 'px');
		$check->setFontBoldItalic(false, true);
		$main_div->addChild($check);				
		*/
		
		
		
		//$line = new HLine(1, 'red');
		//$line->place();
		
	?> <!-- END PHP -->


	<script>
		function ftest() 
		{
			console.log("test_btn click");
			console.log("test_btn click 2");
		}
		//document.getElementById("test_btn").addEventListener('click', db_remove_table);					
	</script> 
 
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


