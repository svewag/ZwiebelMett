ZwiebelMett.Container("Product", {
	fields: ["id", "price"],
    bind: function(container) {
        var self = this;
        this.$container = $(container);
        this.buildGetterAndSetter();

        ZwiebelMett.DOMBind(this.$container.find(":checkbox"), "click", function() {
        	self.message("clicked").pub();
        });
    },

    isSelected: function () {
    	return this.$container.find(":checkbox").is(":checked");
    }
});