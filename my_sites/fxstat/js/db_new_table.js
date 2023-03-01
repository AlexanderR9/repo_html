//js script  db_new_table

//send ajax req func
function db_new_table()
{
	//console.log(this.id+"  "+this.tagName);
	if (this.hasAttribute('disabled'))
	{
		console.log("db_new_table: disabled = ", this.getAttribute('disabled'));
		return;
	}
	let div = document.getElementById("db_main_div");	
	if (div)
	{
		this.setAttribute('disabled', true);		
		while (div.childElementCount > 1)
		{
			let childs = div.children;
			childs[1].remove();	
		}		
		
		let l_ajax = new LAjax('../php/db_new_table.php', 700);
		div.insertAdjacentHTML('beforeend', "<em> try AJAX request sended: URL=["+l_ajax.url()+"] ........</em>");
		l_ajax.trySend();
		
		
		var h2 = document.createElement("h4"); 
		div.appendChild(h2);
			
			//WAIT RESULT FUNCTION
			function wait_func()
			{
				//console.log(LDateTime.currentTime(true)+"...........run t_func()");
				if (l_ajax.hasErr())
				{
					h2.setAttribute('style', 'color:red');
					h2.innerHTML = "ERR: "+l_ajax.getErr()+" ("+l_ajax.strStatus()+")";	
					this.removeAttribute('disabled');					
				}									
				else if (l_ajax.finishedOk())
				{
					console.log("ajax executed ok!");
					//удаление текущих элементов из главного div
					while (div.childElementCount > 1)
					{
						let childs = div.children;
						childs[1].remove();	
					}		
					div.insertAdjacentHTML('beforeend', l_ajax.response());					
					
					//выполнение всех новых скриптов полученных в ответе
					let new_table_div = document.getElementById("db_new_table_div"); 
					let scripts = new_table_div.querySelectorAll("script");
					scripts.forEach(item => eval(item.innerHTML));
					
					
					db_new_table_update_visible(true);
					this.removeAttribute('disabled');
				}
				else
				{
					l_ajax.checkTimeout();				
					setTimeout(wait_func.bind(this), l_ajax.timerInterval());
				}
			}						
			wait_func.call(this);
	}
	else 
	{
		var h2 = document.createElement("h2");
		h2.appendChild(document.createTextNode("ERROR: main_div not found"));
		h2.setAttribute('style', 'color:red');
		document.body.appendChild(h2);		
	}			
}

function showNode(id, d_type = "flex")
{
	let node = document.getElementById(id);	
	if (!node) 
	{
		var h2 = document.createElement("h2");
		h2.appendChild(document.createTextNode("function showNode() - ERROR: node with id ["+id+"] not found"));
		h2.setAttribute('style', 'color:red');
		document.body.appendChild(h2);		
		return;
	}
	node.style.display = d_type;
}
function hideNode(id)
{
	let node = document.getElementById(id);	
	if (!node) 
	{
		var h2 = document.createElement("h2");
		h2.appendChild(document.createTextNode("function hideNode() - ERROR: node with id ["+id+"] not found"));
		h2.setAttribute('style', 'color:red');
		document.body.appendChild(h2);		
		return;
	}
	node.style.display = "none";
}
function isVisibleNode(id)
{
	let node = document.getElementById(id);	
	if (!node) return; 
	return (node.style.display != "none");	
}


function db_new_table_update_visible(start = false)
{
	
	if (start)
	{
		showNode("db_new_table_page1");
		hideNode("db_new_table_page2");
		hideNode("db_new_table_page3");
		hideNode("db_new_table_prev_action");
		hideNode("db_new_table_create_action");
		return;
	}
	
	if (isVisibleNode("db_new_table_page1")) //if show page1		
	{
		console.log("next page");
		hideNode("db_new_table_page1");
		showNode("db_new_table_page2", "block");
		showNode("db_new_table_prev_action");
		return;
	}	

	if (isVisibleNode("db_new_table_page2")) //if show page1		
	{
		console.log("next page");
		hideNode("db_new_table_page2");
		showNode("db_new_table_page3", "block");
		hideNode("db_new_table_next_action");
		showNode("db_new_table_create_action");
		return;
	}	
	
}


function db_new_table_next_action()
{
	console.log("click db_new_table_next_action");
		
	let t_name = document.getElementById("db_new_table_name_input").value.trim();		
	if (isVisibleNode("db_new_table_page1")) //if show page1		
	{
		if (t_name.length == 0) 
		{
			alert("WARNING: table name is empty!");
			return;
		}
		if (t_name.indexOf(" ") > 0) 
		{
			alert("WARNING: table name is invalid, remove all spaces!");
			return;
		}
		
		let tf  = document.getElementById("db_new_table_fields_table");
		tf.caption.innerHTML = "New table: "+t_name;		
		//console.log("table name: " + t_name);
		db_new_table_update_visible();		
	}
	else if (isVisibleNode("db_new_table_page2")) //if show page2		
	{
		let t_fields = new LTable("db_new_table_fields_table");
		if (t_fields.rowCount() <= 2)
		{
			alert("WARNING: invalid column count, must be over 1!");
			return;			
		}
		db_new_table_update_visible();
		
		
		let t_result = new LTable("db_new_table_result_table");
		while (t_result.colCount() > (t_fields.rowCount()-1)) 
			t_result.removeCol(0); 		
		t_result.setColSizes([]);
		
		t_result.setCaptionFont(14, "Olive", true, true);		
		t_result.setCaption(t_name);		
		t_result.setRowFont(0, 16, "blue", true, false, "center");		
		
		for (let j=0; j<t_result.colCount(); j++)
		{
			t_result.setCellData(0, j, t_fields.getCellData(j, 0));
			t_result.setCellData(1, j, "data"+(j+1));
			t_result.setCellData(2, j, "---");
		}
		t_result.setCellData(3, 0, "*");
	}		
}

function db_new_table_prev_action()
{
	console.log("click db_new_table_prev_action");
	
	if (isVisibleNode("db_new_table_page2")) //if show page2		
	{
		showNode("db_new_table_page1");
		hideNode("db_new_table_page2");
		hideNode("db_new_table_prev_action");
	}	
	else if (isVisibleNode("db_new_table_page3")) //if show page3
	{
		showNode("db_new_table_page2", "block");
		hideNode("db_new_table_page3");
		hideNode("db_new_table_create_action");
		showNode("db_new_table_next_action");
	}		
	
}

function db_new_table_add_field()
{
	console.log("click db_new_table_add_field");
	
	let f_name = document.getElementById("db_new_table_field_input").value.trim();
	if (f_name.length == 0 || f_name.indexOf(" ") > 0) 
	{
			alert("WARNING: field name is invalid!");
			return;
	}
	let tf  = document.getElementById("db_new_table_fields_table");		
	
	function fields()
	{
		let arr = [];
		for (let row of tf.rows)
		{
			if (row.parentElement.tagName.toLowerCase() == "thead") continue;
			if (row.cells[0].innerHTML == "*") break;
			arr.push(row.cells[0].innerHTML);
		}
		return arr;
	}	
	if (fields().indexOf(f_name) >= 0)
	{
		alert("WARNING: this field name already exist!");
		return;
	}
	
	function resetInputs()
	{
		document.getElementById("db_new_table_field_input").value = "";
		document.getElementById("db_new_table_primary_input").checked = false;
		document.getElementById("db_new_table_unique_input").checked = false;
	}
		

	let d_type_obj = document.getElementById("db_new_table_datatype_input");
	let is_primary = document.getElementById("db_new_table_primary_input").checked;
	let is_unique = document.getElementById("db_new_table_unique_input").checked;
	
	console.log(f_name+" / "+d_type_obj.value+" / "+Boolean(is_primary)+" / "+ is_unique);
	
	let new_row = tf.insertRow(fields().length+1);
	let cell = new_row.insertCell();
	cell.innerHTML = f_name;
	cell = new_row.insertCell();
	cell.innerHTML = d_type_obj.value;
	cell = new_row.insertCell();
	cell.innerHTML = (is_primary ? "true" : "false");
	cell = new_row.insertCell();
	cell.innerHTML = (is_unique ? "true" : "false");
	new_row.id = ("frow"+fields().length);
	new_row.classList.add('removable_row');
	new_row.ondblclick = function(e) {e.target.parentElement.remove();}
	
	resetInputs();
}


//AJAX func
function db_new_table_create_action()
{
	console.log("click db_new_table_create_act");
	if (this.hasAttribute('disabled'))
	{
		console.log("db_new_table_create_action: button is disabled");
		return;
	}

	
	let t = new LTable("db_new_table_fields_table");
	let status_text = document.getElementById("db_new_table_status");
	status_text.innerHTML = "creating table ............";
	status_text.style.color = "DarkOrange";
	hideNode("db_new_table_prev_action");
	this.setAttribute('disabled', 'true');
	console.log(t.info());
	
		///prepare ajax request
		let t_name = document.getElementById("db_new_table_name_input").value.trim();		
		let l_ajax = new LAjax('../php/db_new_table.php', 2000);
		l_ajax.addParameter('t_name', t_name);
		for (let i=0; i<(t.rowCount()-1); i++)
		{
			let key = "field"+(i+1);
			//let value = t.getCellData(i, 0)+";"+mysqlDatatype(t.getCellData(i, 1))+";"; 
			let value = t.getCellData(i, 0)+";"+t.getCellData(i, 1)+";"; 
			value += (t.getCellData(i, 2)+";"+t.getCellData(i, 3));
			l_ajax.addParameter(key, value);						
		}
		l_ajax.trySend();

			//WAIT RESULT FUNCTION
			function wait_func()
			{
				//console.log(LDateTime.currentTime(true)+"...........run t_func()");
				if (l_ajax.hasErr())
				{
					status_text.style.color = "red";
					status_text.innerHTML = "ERR: "+l_ajax.getErr()+" ("+l_ajax.strStatus()+")";	
					this.removeAttribute('disabled');					
				}									
				else if (l_ajax.finishedOk()) //ajax runned ok
				{
					console.log("ajax executed ok!");
					let result = l_ajax.response().trim().toLowerCase();
					if (result != "ok") //db action fault
					{
						status_text.style.color = "red";
						status_text.innerHTML = "ERR: "+result;	
						this.removeAttribute('disabled');											
					}
					else
					{
						status_text.style.color = "blue";
						status_text.innerHTML = "Creating result: OK!";	
						this.style.opacity = "0.3";	
					}
					
					//status_text.style.color = "blue";
					//status_text.innerHTML = "AJAX finished Ok!";
					//document.body.insertAdjacentHTML('beforeend', "SQL request result: "+l_ajax.response());
					//this.removeAttribute('disabled');
					
				}
				else
				{
					l_ajax.checkTimeout();				
					setTimeout(wait_func.bind(this), l_ajax.timerInterval());
				}
			}						
			wait_func.call(this);
	
}
/*
function mysqlDatatype(type)
{
	if (type == 'char') return "CHAR(1)";
	if (type == 'string') return "VARCHAR(100)";
	if (type == 'text') return "TEXT";
	if (type == 'float') return "FLOAT";
	if (type == 'date') return "DATE";
	if (type == 'time') return "TIME";
	if (type == 'bool') return "BOOLEAN";
	
	if (type == 'int8') return "TINYINT";
	if (type == 'uint8') return "TINYINT UNSIGNED";
	if (type == 'int16') return "SMALLINT";
	if (type == 'uint16') return "SMALLINT UNSIGNED";
	if (type == 'int32') return "INT";
	if (type == 'uint32') return "INT UNSIGNED";

	return "none";
}
*/

