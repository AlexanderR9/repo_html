//js script

/*
	let div = document.getElementById("db_main_div");	
	if (div)
	{
		if (div.childElementCount == 2)
		{
			div.lastChild.remove();	
		}
		
	}
	else 
	{
		var h2 = document.createElement("h2");
		h2.appendChild(document.createTextNode("ERROR: main_div not found"));
		h2.setAttribute('style', 'color:red');
		document.body.appendChild(h2);
	}			
	
*/

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

console.log("AJAX request sended (remove table)");


