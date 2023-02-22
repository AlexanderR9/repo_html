//js script  db_new_table

function db_new_table()
{
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
		
		let l_ajax = new LAjax('../php/db_new_table.php');
		//l_ajax.addParameter('act_mode', 'form');
		//l_ajax.addParameter('t_name', 'couple');
		div.insertAdjacentHTML('beforeend', "<em> try AJAX request sended: URL=["+l_ajax.url()+"] ........</em>");
		l_ajax.trySend();
		
		
		var h2 = document.createElement("h4"); 
		div.appendChild(h2);
		if (l_ajax.hasErr())
		{
			h2.setAttribute('style', 'color:red');
			h2.innerHTML = "ERR: "+l_ajax.getErr();		
			this.removeAttribute('disabled');			
		}
		else
		{
			h2.innerHTML = "n_timeout: ?";
			let nt = 0;
			let timeout = 2000;
			function t_func()
			{
				console.log("run t_func()");
				nt++;
				h2.innerHTML = "n_timeout: "+nt;			
				if (l_ajax.finishedOk())
				{
					//удаление текущих элементов из главного div
					while (div.childElementCount > 1)
					{
						let childs = div.children;
						childs[1].remove();	
					}		
					div.insertAdjacentHTML('beforeend', l_ajax.response());					
					this.removeAttribute('disabled');
					db_new_table_update_visible(true);
					return;						
				}
				if (l_ajax.hasErr())
				{
					h2.setAttribute('style', 'color:red');
					h2.innerHTML = "ERR: "+l_ajax.getErr()+" ("+l_ajax.strStatus()+")";	
					this.removeAttribute('disabled');					
					return;
				}									
				if (nt > 10) 
				{
					l_ajax.tryAbort();
					h2.setAttribute('style', 'color:red');
					h2.innerHTML = "ERR: "+l_ajax.getErr();	
					this.removeAttribute('disabled');
					return;	
				}
				
				setTimeout(t_func.bind(this), timeout);
			}			
			
			t_func.call(this);
		}
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
		
	if (isVisibleNode("db_new_table_page1")) //if show page1		
	{
		let t_name = document.getElementById("db_new_table_name_input").value.trim();
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
		
		
		console.log("table name: " + t_name);
		//alert("table name is OK");
		db_new_table_update_visible();
		
	}
	else if (isVisibleNode("db_new_table_page2")) //if show page1		
	{
		let tf  = document.getElementById("db_new_table_fields_table");
		let tbody = tf.tBodies[0];
		console.log(tbody.tagName+"   childs: "+tbody.childElementCount);
		if (tbody.childElementCount <= 2)
		{
			//alert("WARNING: invalid column count, must be over 1!");
			//return;			
		}
		db_new_table_update_visible();
		
		
		let tr_rows = document.getElementById("db_new_table_result_table").getElementsByTagName("tr");
		console.log(tr_rows+"  count: "+tr_rows.length);
		for (let j=0; j<10; j++)
		{
			for (let i=0; i<tr_rows.length; i++)
			{
				let cells = tr_rows[i].children;
				cells[j].remove();
			}
		}
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
	
	/*
	if (fields().length = 0)
	{
		 //let h_cell = tf.rows[0].insertCell();
		 //h_cell.innerHTML = "act";
		var trArr = tf.getElementsByTagName('tr');
	    for (var i = 0, l = trArr.length; i < l; i++)
	        trArr[i].insertCell(0);
	}
	*/
	
	
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

function db_new_table_create_action()
{
	console.log("click db_new_table_create_act");
	
	let t = new LTable("db_new_table_fields_table");
	console.log(t.info());
	
	//t.removeHeader();
	t.appendRow(0);
	t.setCellData(1, 2, "bbb");
	//t.removeCol(2);
	//t.removeCol(2);
	t.setTableDataFont(26, 'green', true, true, 'right');
	//t.removeRow(1);
	
	t.setColSizes([15, 15, 20, 50]);
	
	console.log(t.getCellData(0, 1)+"   "+t.getHeaderCellData(1));

	
	//db_new_table_update_visible(true);
	
}

