//js script


	let div = document.getElementById("db_main_div");	
	if (div)
	{
		//console.log("find [db_main_div] element, childs: ", div.childElementCount);
		if (div.childElementCount == 2)
		{
			let childs = div.children;
			//console.log("get arr of childs, size = ", childs.length);
			//for (let i=0; i<childs.length; i++)
				//console.log(i+1,". ", childs[i].tagName, " / ", childs[i].nodeName, " / ", childs[i].nodeType, " / ", childs[i].id);
			
			//console.log("try  remove node: <",childs[1].tagName," id=",childs[1].id,">");
			childs[1].remove();	
		}
		
		let l_ajax = new LAjax('../php/db_new_table.php');
		l_ajax.addParameter('act_mode', 'form');
		l_ajax.addParameter('t_name', 'couple');
		l_ajax.trySend();
		
		
		div.insertAdjacentHTML('beforeend', "<em>AJAX request sended</em>");
		
		
		
		var h2 = document.createElement("h2"); div.appendChild(h2);
		var h2_1 = document.createElement("h2"); div.appendChild(h2_1);
		h2.innerHTML = "xhr_counter: ?";
		h2_1.innerHTML = "n_timeout: ?";
		
		let nt = 0;
		function t_func()
		{
			nt++;
			h2.innerHTML = "xhr_counter: "+l_ajax.counter;
			h2_1.innerHTML = "n_timeout: "+nt;			
			if (nt > 10) clearInterval();
		}
		
		setInterval(t_func, 1000);
	}
	else 
	{
		var h2 = document.createElement("h2");
		h2.appendChild(document.createTextNode("ERROR: main_div not found"));
		h2.setAttribute('style', 'color:red');
		document.body.appendChild(h2);		
	}			
	


/*
let xhr = new XMLHttpRequest();
var php_script = '../php/db_new_table.php';
var params = "tname="+encodeURIComponent("couples");
params += "&n_fields="+encodeURIComponent(6);
params += "&primary_key="+encodeURIComponent("tiker_id");

xhr.open('POST', php_script, true);
xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); 

xhr.onreadystatechange = function() 
{
	//console.log("current state: "+xmlhttp.readyState);    
	if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) 
	{
		console.log("request finished ok!");
		console.log(xhr.responseText);		
    }
};
xhr.send(params);
*/

console.log("AJAX request sended (create table)");



