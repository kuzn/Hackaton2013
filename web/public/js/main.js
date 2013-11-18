$(function() {
	$(".row.header").click(function() {
		window.location = '/'
	})

	$.getJSON("/getTags", function(tags) {

	    $(".tags-input").each(function() {
	    	var $this = $(this)
	    	console.log($this.val())

	    	var selected = $this.val()
	    		.split(',')
	    		.filter(function(name) { return name.trim() != ""; })
	    		.map(function(name) {
	    			return tags.filter(function(tag) { return tag.name == name; 
	    		})[0]
	    	})

		    $this.autoSuggest(tags, {
		    	selectedValuesProp : "name",
		    	selectedItemProp: "name",
		    	searchObjProps: "name",
		    	preFill: selected,
		    	startText: ""
		    });	

		    $('form').submit(function() {
		    	var inputs = $(".as-selections input")
		    	$(inputs[0]).val($(inputs[1]).val())
		    })
	    })

	})

})