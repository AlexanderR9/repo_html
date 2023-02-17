//js script  db_new_table


function db_new_table()
{

	let sender_id = "db_new_table";
	let btn = document.getElementById(sender_id);	
	if (!btn) return;
	
	if (btn.hasAttribute('disabled'))
	{
		console.log("db_new_table: disabled = ", btn.getAttribute('disabled'));
		return;
	}
	

	let div = document.getElementById("db_main_div");	
	if (div)
	{
		btn.setAttribute('disabled', true);
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
			btn.removeAttribute('disabled');			
		}
		else
		{
			h2.innerHTML = "n_timeout: ?";
			let nt = 0;
			let timeout = 300;
			function t_func()
			{
				nt++;
				h2.innerHTML = "n_timeout: "+nt;			
				if (l_ajax.finishedOk())
				{
					clearTimeout(timeout);
					h2.setAttribute('style', 'color:blue');
					h2.innerHTML = "FINISHED OK!: ";			
					//var result = document.createElement("p"); 
					//result.innerHTML = l_ajax.response();
					//document.body.appendChild(result);
					
					while (div.childElementCount > 1)
					{
						let childs = div.children;
						childs[1].remove();	
					}		
					div.insertAdjacentHTML('beforeend', l_ajax.response());
					
					
					btn.removeAttribute('disabled');
					return;						
				}
				if (l_ajax.hasErr())
				{
					clearTimeout(timeout);
					h2.setAttribute('style', 'color:red');
					h2.innerHTML = "ERR: "+l_ajax.getErr()+" ("+l_ajax.strStatus()+")";	
					btn.removeAttribute('disabled');					
					return;
				}									
				if (nt > 10) 
				{
					clearTimeout(timeout);
					l_ajax.tryAbort();
					h2.setAttribute('style', 'color:red');
					h2.innerHTML = "ERR: "+l_ajax.getErr();	
					btn.removeAttribute('disabled');
					return;	
				}
				
				setTimeout(t_func, timeout);
			}			
			setTimeout(t_func, timeout);
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


