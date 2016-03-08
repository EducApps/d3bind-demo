
function tabsDemo(parent) {
    return component({
        view: {
            render: function () {
                tabs(parent, function(tabsContent) { return [
                    tabPane(tabsContent, 'Tab 1 title', true, function(content) {
                        content.append('span').text('Tab #1 Content');
                    }),
                    tabPane(tabsContent, 'Tab 2 title', false, function(content) {
                        content.append('span').text('Tab #2 Content');
                    })
                ]});
            }
        }
    });
}