const LAState = {lasNone: 10, lasBuzy: 11, lasFinished: 12}


class LAjax
{
	
	constructor(url) 
	{
		this._type = 'POST';
		this._params = new Map();
		this._req = new XMLHttpRequest();
		this._script_file = url;
		this._err = '';
		this._state = LAState.lasNone;
		this.counter = 0;
	}			
	
	//funcs
	addParameter(key, value) {this._params.set(key, value);}
	paramCount() {return this._params.size;}
	hasParams() {return (this.paramCount() > 0);}
	
	
	trySend()
	{
		this._prepare();
		this._state = LAState.lasBuzy;
		console.log("try send ajax request ..............");
		if (this.hasParams())
		{
			console.log("has params: ", this.paramCount(), "    POST_FORMAT: ", this._toPostParams());	
			this._req.send(this._toPostParams());
		}
		else this._req.send();
		
	}
	
	//protected
	_prepare()
	{
		if (!this.hasParams()) this._type = 'GET';
		this._req.open(this._type, this._script_file, true);
		this._req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); 
		this._req.onreadystatechange = this._exec();
	}
	_toPostParams()
	{
		let url_params = "";
		for (let key of this._params.keys()) 
		{			
			let s = key + "=" + encodeURIComponent(this._params.get(key));
			if (url_params === "") url_params = s;
			else url_params += ("&" + s);			
		}
		return url_params;
	}

	_exec()
	{
		this.counter++;
		console.log("_req.readyState = ", this._req.readyState);
		if (this._req.readyState == XMLHttpRequest.DONE && this._req.status == 200) 
		{
			console.log("request finished ok!");
			this._state = LAState.lasFinished;
		}		
	}

}


