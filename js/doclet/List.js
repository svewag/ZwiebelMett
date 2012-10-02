ZwiebelMett.Doclet("List", {
	_products: [],
	bind: function(node, isPartial) {
    	var self = this;
    	$(node).find(".cont-Product").each(function () {
     		self._products.push(ZwiebelMett.Container("Product").create(this, self));
    	});

    	ZwiebelMett.Message.sub("Container:Product:clicked", function () {
    		var sum = 0;
    		for (var i = self._products.length - 1; i >= 0; i--) {
    			var product = self._products[i];
    			if(product.isSelected()){
    				sum += 1*product.price();
    			}
    		};

    		ZwiebelMett.Message.pub("Container:Total:update", sum);
    	});
    },

    ready: function (argument) {
    	ZwiebelMett.Message.pub("Container:Total:update", 0);
    }
});