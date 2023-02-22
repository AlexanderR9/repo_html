//class for working  with html table
class LTable 
{
  constructor(t_id) 
  { 
	this._id = t_id;
	this._node = document.getElementById(t_id);
	
  }
    
  isNull() {return (this._node == null);}
  rowCount() //without header
  {
	if (this.isNull()) return -1;
	return (this._node.rows.length - this.headerRowCount());	
  }
  colCount()
  {
	if (this.isNull()) return -1;
	if (this.rowCount() > 0)
	{
		return this._node.rows[0].cells.length;
	}
	return 0;
  }
  hasCaption() 
  {
	if (this.isNull()) return false;
	return (this._node.caption != null);
  }  
  captionText()
  {
	  if (!this.hasCaption()) return "??";
	  //let s = this._node.caption.innerHTML.trim();
	  //s.replace("/\r|\n/g", '');
	  return this._node.caption.innerHTML.trim();
  }
  setCaption(text)
  {
	  if (this.isNull()) return;
	  if (!this.hasCaption()) this._node.createCaption();
	  this._node.caption.textContent = text;
  }
  hasHeader() 
  {
	if (this.isNull()) return false;
	return (this._node.tHead != null);
  }
  headerRowCount()
  {
	  if (!this.hasHeader()) return 0;
	  return this._getHeader().childElementCount;
  }
  setCellData(i, j, text)
  {
	if (i < 0 || i >= this.rowCount()) return;  
	if (j < 0 || j >= this.colCount()) return;  
	this._getRow(i).cells[j].innerHTML = text;
  }
  getCellData(i, j)
  {
	if (i < 0 || i >= this.rowCount()) return "?";  
	if (j < 0 || j >= this.colCount()) return "?";  
	return this._getRow(i).cells[j].innerHTML.trim();	  
  }
  setHeaderCellData(j, text)
  {
	  if (j < 0 || j >= this.colCount()) return;  
	  let h = this._getHeader();
	  if (h)
	  {
		  let rows = h.querySelectorAll('tr');
		  if (rows) rows[0].cells[j].innerHTML = text;
	  }
  }
  getHeaderCellData(j)
  {
	if (j < 0 || j >= this.colCount()) return "?";  
	let h = this._getHeader();
	if (!h) return "?";  
	let rows = h.querySelectorAll('tr');
	if (rows) return rows[0].cells[j].innerHTML.trim();
	return "?";    
  }  
  removeRow(i)
  {
	  let row = this._getRow(i);
	  if (row) row.remove();
  }
  removeHeader()
  {
	  let h = this._getHeader();
	  if (h) h.remove();
  }
  appendRow()
  {
	  if (this.isNull()) return null;
	  let row = this._node.insertRow();
	  this._initNewRow(row);
	  return row;
  }
  insertRow(i)
  {
	  if (this.isNull()) return null;
	  if (i < 0 || i >= this.rowCount()) return null;  	  
	  
	  let row = this._node.insertRow(i+this.headerRowCount());
	  this._initNewRow(row);
	  return row;
  }
  appendCol()
  {
	  if (this.isNull()) return;
	  
	  let rows = this._node.rows;
	  if (rows.length > 0)
	  {
		for (let i=0; i<rows.length; i++)  
			rows[i].insertCell();
	  }
  }
  insertCol(j)
  {
	  if (this.isNull()) return null;
	  if (j < 0 || j >= this.colCount()) return null;  	  

	  let rows = this._node.rows;
	  if (rows.length > 0)
	  {
		for (let i=0; i<rows.length; i++)  
			rows[i].insertCell(j);
	  }	  
  }
  removeCol(j)
  {
	  if (this.isNull()) return null;
	  if (j < 0 || j >= this.colCount()) return null;  	  
	  
	  let rows = this._node.rows;
	  if (rows.length > 0)
	  {
		for (let i=0; i<rows.length; i++)  
			rows[i].cells[j].remove();
	  }	  
  }
  setCaptionFont(size, color = 'black', b = false, i = false, align = "")
  {
	let el = this._getCaption();
	this._setElementFont(el, size, color, b, i, align);
  }
  setHeaderFont(size, color = 'black', b = false, i = false, align = "")
  {
	let el = this._getHeader();
	this._setElementFont(el, size, color, b, i, align);
  }
  setTableDataFont(size, color = 'black', b = false, i = false, align = "")
  {
	  /*
	if (this.isNull()) return;
	let tstyle = this._node.querySelector("style");
	if (tstyle)
	{
		console.log(tstyle, "  childs: "+tstyle.childElementCount);
	}
	*/
		
	  
	let el = this._getBody();	
	this._setElementFont(el, size, color, b, i, align);
  }
  setColSizes(arr_sizes) //sum arr(int) must be 100%
  {
	let el = this._getColGroup();	
	if (!el)
	{
		console.log("_getColGroup: NULL");
		return;
	}
	
	if (arr_sizes.length != this.colCount()) {console.log("ERR: setColSizes - (arr_sizes.length != colCount) "); return;}
	let sum = 0;
	arr_sizes.forEach(function(item) {sum += item;});
	if (sum != 100) {console.log("ERR: setColSizes - arr_sizes sum != 100%"); return;}
		
	console.log(el, "  childs: "+el.childElementCount+ "  sum="+sum);	
	var child = el.lastElementChild; 
    while (child) {el.removeChild(child); child = el.lastElementChild;}
	
	arr_sizes.forEach(function(item) 
	{
		child = document.createElement("col");
		child.setAttribute("width", item+"%");
		child.setAttribute("span", "1");
		el.appendChild(child);
	});
	
  }

  
  

	info()
	{
		let s = "LTable OBJ: id=["+this._id+"]  ";
		if (this.isNull()) {s += "null"; return s;}
		s += "rows/cols = "+this.rowCount()+"/"+this.colCount()+"  ";
		if (this.hasCaption()) s += "has_caption("+this.captionText()+")  ";
		else s += "no_caption  ";
		if (this.hasHeader()) s += "has_header(rows="+this.headerRowCount()+")  ";
		else s += "no_header  ";
		
		
		
		return s;	
	}		
 
 ////////////protected////////////////////////
 
	_getRow(i)
	{
		if (i < 0 || i >= this.rowCount()) return null;  
		return this._node.rows[i+this.headerRowCount()];
	}
	_initNewRow(row)
	{
		if (!row) return;
		let n_cols = this.colCount();
		for (let j=0; j<n_cols; j++)
			row.insertCell();
	}
	_getColGroup()
	{
		if (!this.hasCaption()) return null;
		return this._node.querySelector("colgroup");		
	}
	_getCaption()
	{
		if (!this.hasCaption()) return null;
		return this._node.caption;
	}
	_getHeader() 
	{
		if (!this.hasHeader()) return null;
		return this._node.tHead;
	}
	_getBody() 
	{
		if (this.isNull()) return null;
		let bd = this._node.tBodies;
		if (bd && bd.length > 0) return bd[0];
		return null;
	}
	_setElementFont(el, size, color, b, i, align = "")
	{
		if (el)
		{
			el.style.fontSize = size+"px";
			el.style.color = color;
			if (align.length > 0) el.style.textAlign = align;
			if (i) el.style.fontStyle = "italic";
			if (b) el.style.fontWeight = "bold";			
		}
	}
 
}



