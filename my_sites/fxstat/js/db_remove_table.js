//js script db_remove_table

function db_remove_table()
{
	if (this.hasAttribute('disabled'))
	{
		console.log(this.id+": disabled = ", this.getAttribute('disabled'));
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
		
		let l_ajax = new LAjax('../php/db_remove_table.php', 1000);
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
					let ns = LScript.execBlockScripts('db_remove_table_div');
					console.log("exec "+ns+" scripts from response.");
					
					
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

function setEnable(enable)
{
	let combo = document.getElementById("db_remove_table_combo_changed");
	let btn = document.getElementById("db_remove_table_destroy_action");
	if (enable)
	{
		combo.style.opacity = "1";	
		btn.style.opacity = "1";	
		combo.removeAttribute('disabled');	
		btn.removeAttribute('disabled');	
	}
	else
	{
		let t = document.getElementById("db_remove_table_info_table");
		if (t) t.remove();
		combo.setAttribute('disabled', 'true');
		combo.style.opacity = "0.3";				
		btn.setAttribute('disabled', 'true');
		btn.style.opacity = "0.3";				
	}
}


//AJAX func (get info about table)
function db_remove_table_combo_changed()
{
	console.log("item changed: "+this.id);	
	let combo = new LComboBox(this.id);	
	let status_text = document.getElementById("db_remove_table_status");
	status_text.innerHTML = "Getting info for "+combo.currentItemText()+" ............";
	status_text.style.color = "DarkOrange";
	setEnable(false);
		
		///prepare ajax request
		let l_ajax = new LAjax('../php/db_remove_table.php', 1000);
		l_ajax.addParameter('t_name', combo.currentItemText());
		l_ajax.addParameter('action', 'get_info');
		l_ajax.trySend();
	
	//WAIT RESULT FUNCTION
	function wait_func()
	{
		if (l_ajax.hasErr())
		{
			status_text.style.color = "red";
			status_text.innerHTML = "ERR: "+l_ajax.getErr()+" ("+l_ajax.strStatus()+")";	
			setEnable(true);		
		}									
		else if (l_ajax.finishedOk()) //ajax runned ok
		{
			//console.log("ajax executed ok!");
			let result = l_ajax.response().trim();			
			if (result.indexOf("<table") < 0) //db action fault
			{
				status_text.style.color = "red";
				status_text.innerHTML = "ERR: "+result;	
				setEnable(true);		
			}
			else
			{
				status_text.style.color = "blue";
				status_text.innerHTML = "Get info result: OK!";	
				setEnable(true);		
				
				let t_div = document.getElementById("db_remove_table_info_div");
				if (t_div) t_div.insertAdjacentHTML('beforeend', result);
			}
		}
		else
		{
			l_ajax.checkTimeout();				
			setTimeout(wait_func.bind(this), l_ajax.timerInterval());
		}
	}						
	wait_func.call(this);	
}

//AJAX func (remove table)
function db_remove_table_destroy_action()
{
	console.log("click: "+this.id);
	let combo = new LComboBox('db_remove_table_combo_changed');	
	let status_text = document.getElementById("db_remove_table_status");
	status_text.innerHTML = "Removing table "+combo.currentItemText()+" ............";
	status_text.style.color = "DarkOrange";
	setEnable(false);

		///prepare ajax request
		let l_ajax = new LAjax('../php/db_remove_table.php', 1000);
		l_ajax.addParameter('t_name', combo.currentItemText());
		l_ajax.addParameter('action', 'destroy');
		l_ajax.trySend();

	//WAIT RESULT FUNCTION
	function wait_func()
	{
		if (l_ajax.hasErr())
		{
			status_text.style.color = "red";
			status_text.innerHTML = "ERR: "+l_ajax.getErr()+" ("+l_ajax.strStatus()+")";	
			setEnable(true);		
		}									
		else if (l_ajax.finishedOk()) //ajax runned ok
		{
			let result = l_ajax.response().trim().toLowerCase();
			if (result != "ok") //db action fault
			{
				status_text.style.color = "red";
				status_text.innerHTML = "ERR: "+result;	
				setEnable(true);		
			}
			else // OK
			{
				status_text.style.color = "blue";
				status_text.innerHTML = "Table removed OK!";	
				setEnable(true);						
				combo.removeCurrentItem();
			}
		}
		else
		{
			l_ajax.checkTimeout();				
			setTimeout(wait_func.bind(this), l_ajax.timerInterval());
		}
	}						
	wait_func.call(this);	

}




