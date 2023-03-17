//CHANGE VIEW MODE SCRIPT

		function resetDStyle(dp_id)
		{
		  let sty = document.getElementById(dp_id).style;
		  sty.background = "";
		  sty.color = "gray";
		  sty.fontWeight = "";					  			
		}
		function dpClick(dp)
		{
			dp.style.background = "Aquamarine";
			dp.style.color = "blue";
			dp.style.fontWeight = "bold";
			console.log("click by "+dp.id);
			if (dp.id == "2d") resetDStyle('3d');
			else resetDStyle('2d');	

			changeDMode(dp.id);
		}
		function changeDMode(dp_id)
		{
			let proj_div = document.getElementById("project_div");
			//if (proj_div.hasAttribute("data-mode") && proj_div.dataset.mode == dp_id) return;				
			if (proj_div.dataset.mode === dp_id) return;
			
			proj_div.firstElementChild.innerText = dp_id.toUpperCase()+" canvas";
			proj_div.dataset.mode = dp_id;
			
			let canvas = document.getElementById("canvas");
			if (canvas)
			{
				console.log("try remove canvas");
				canvas.remove();
			}
			
			let module = null;
			if (dp_id == "2d") module = import("./project_2d.js");
			else module = import("./project.js");

		}			
	
		let dp = document.querySelectorAll(".D_type");
		dp.forEach(function(item) {
			item.style.border = "1px solid SteelBlue";
			item.style.borderRadius = "10px";			
			item.onclick = function() {dpClick(item);}
		});
		
		dpClick(document.getElementById("3d"));


