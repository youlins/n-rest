
module.exports = function(md){
	var html ="";
	var head = "";

	function getHead() {
		if(head.length > 0) {
			return head;
		}
		head += '<head><meta http-equiv="Content-Type" content="text/html; charset=utf-8">';
		head += '<style>';
		head += 'html,body{margin:0px auto;}';
		head += 'div,span{font-size:16px;line-height:20px;padding-left:20px;}';
		head += '.code, .code span{font-size:14px;margin-left:20px;width:80%;padding-left:0px;}';
		head += '</style>';
		head + "</head>";
		return head;
	}

	function getTag(tagName, tagValue) {
		return '<' + tagName + '>' + tagValue + '</' + tagName + '>';
	}

	this.render = function() {

		html = "<html>" + getHead() + "<body>";
			

		var codeBeginOrEnd = 0;

		md.replace(/[^\r\n]*\r\n/g, function(line) {
			console.log(line);
			if(line == '```\r\n') {
				codeBeginOrEnd = (codeBeginOrEnd + 1) % 2;
				if(codeBeginOrEnd == 1) {
					html += '<div class="code">';
				} else {					
					html += '</div>';
				}
			} else if (codeBeginOrEnd == 1) {
				html += getTag('span', line.replace(/ /g, "&nbsp&nbsp"));
				html += '<br />';
			} else if(line.startsWith("# ")) {
				html += getTag('h2', line.replace(/^# /, ""));
			} else if(line.startsWith("## ")) {
				html += getTag('h2', line.replace(/^## /, ""));
			} else if(line.startsWith("### ")) {
				html += getTag('h3', line.replace(/^### /, ""));
			} else if(line.startsWith("#### ")) {
				html += getTag('h4', line.replace(/^#### /, ""));
			} else {				
				html += getTag('div', line);
			}

		})

		html += "</html></body>";
		return html;
	}

	this.save = function(filePath) {
		var fs = require('fs');
		if(html.length == 0) {
			this.render();
		}
		if(html.length > 0) {
			fs.writeFile(filePath, html, 'utf8', function (err) {
				if (err) console.log('Save error:' + err);
				console.log('It\'s saved!');
			});
		}
	}

}