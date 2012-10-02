ZwiebelMett.Container("Total", {
    bind: function(container) {
        var self = this;
        this.$container = $(container);
        this.buildGetterAndSetter();

        this.message("update").sub(function (event, total) {
        	self.$container.find("span").text(total + " €");
        });
    }
}); 