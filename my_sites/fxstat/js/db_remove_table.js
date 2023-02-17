//js script db_remove_table

function db_remove_table()
{
	//console.log("AJAX start");
	let sender_id = this.id;
	
	let s = "node type "+this.nodeText+",  id="+this.id;
	//let html_code = "<em>"+s+"</em>";
	//document.body.insertAdjacentHTML('beforebegin', html_code);
	
	
	//let sender_id = "db_remove_table";
	//let btn = document.getElementById(sender_id);	
	//if (!btn) return;
	
	if (this.hasAttribute('disabled'))
	{
		console.log("db_new_table: disabled = ", btn.getAttribute('disabled'));
		return;
	}
	
	
	this.setAttribute('disabled', true);
	
	
	if (this.getAttribute('disabled') == "true")
		console.log("has attr db_new_table: disabled = ", this.getAttribute('disabled'));
	
	console.log("AJAX request sended (remove table)");
	
	//this.removeAttribute('disabled');
	
	//setTimeout(() => {this.removeAttribute('disabled');}, 2000);
	
	let tn = 0;
	function tf() 
	{
		//alert('Привет');
		let html_code = "<em>"+s+"</em><br>";
		document.body.insertAdjacentHTML('beforebegin', html_code);
		tn++;	
		if (tn > 5) return;
		setTimeout(tf, 2000);
	}
	
	setTimeout(() => this.removeAttribute('disabled'), 3000);
	
	tf() ;
}




