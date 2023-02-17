//const LAState = {lasNone: 10, lasBuzy: 11, lasFinished: 12}


class LAjax
{	
	constructor(url) 
	{
		this._type = 'POST';
		this._params = new Map();
		this._req = new XMLHttpRequest();
		this._script_file = url;
		this._err = '';
		//this._state = LAState.lasNone;
		
		this.counter1 = 0;
		//this.counter2 = 0;
	}			
	
	//funcs
	addParameter(key, value) {this._params.set(key, value);}
	paramCount() {return this._params.size;}
	hasParams() {return (this.paramCount() > 0);}
	hasErr() {return (this._err.length > 0);}
	getErr() {return this._err;}
	url() {return this._script_file;}
	
	
	/* текущий код состояния выпонения запроса
	    0 — Unitialized
		1 — Loading
		2 — Loaded
		3 — Interactive
		4 — Complete (завершен)
	*/	
	requestState() {return this._req.readyState;}
	
	//код успешности выполненного запроса (200 - OK)
	ajaxStatus() {return this._req.status;} 
	
	strStatus() {return "state: "+this.requestState()+" / "+this.ajaxStatus();}
	
	
	response() {return (this.isRunning() ? "running ...." : this._req.responseText);}
	
	
	finishedOk() {return (this.done() && this._req.status == 200);} //запрос выполнился успешно
	done() {return (this._req.readyState == XMLHttpRequest.DONE);} //запрос завершил выполнение (не важно с каким результатом)
	isRunning() {return (!this.done());} //запрос выполняется в текущий момент
	
	trySend()
	{
		this._err = "";
		this._prepare();
		if (this.hasErr()) return;
		
		//this._state = LAState.lasBuzy;
		console.log("try send ajax request ..............");
		if (this.hasParams())
		{
			console.log("has params: ", this.paramCount(), "    POST_FORMAT: ", this._toPostParams());	
			this._req.send(this._toPostParams());
		}
		else this._req.send();
		
	}
	tryAbort() 
	{
		if (this.isRunning()) 
		{
			this._req.abort();
			this._err = "ABORTED, request timeout";
		}
	}
	
	
	//protected
	_prepare()
	{
		if (this._script_file.length == 0) 
		{
            this._err = "URL is empty";
			return;
		}
		if (this._script_file.slice(-4) != ".php") 
		{
            this._err = "URL is not php script";
			return;
		}
		
		
		if (!this.hasParams()) this._type = 'GET';
		this._req.open(this._type, this._script_file, true);
		this._req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); 
		this._req.onreadystatechange = () => {this._func_statechanged();}
		
		//this._req.upload.addEventListener("progress", this.updateProgress);
		//this._req.upload.addEventListener("onreadystatechange", this._func_statechanged);
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
	_func_statechanged()
	{
		this.counter1++;
		//console.log("current state = ", this._req.readyState);
		if (this.done())
		{
			if (this._req.status == 200)
			{
				//OK
			}
			else
			{
				this._err = this._req.statusText;
			}
		}
	}


}


