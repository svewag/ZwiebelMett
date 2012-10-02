ZwiebelMett.Doclet("Basket", {
	bind: function(node, isPartial) {
    	var self = this;
    	$(node).find(".cont-Total").each(function () {
     		ZwiebelMett.Container("Total").create(this, self);
    	});
    }
});