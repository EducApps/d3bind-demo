
function tabs(parent, contentRenderer) {
    return component({

        model: {
            panes: []
        },

        ctrl: {
            select: function(pane) {
                this.model.panes.forEach(function(pane) {
                    pane.model.selected = false;
                });
                pane.model.selected = true;
            }
        },

        view: {
            render: function() {
                var _this = this;
                var div = parent.append('div').classed('tabbable', true);
                var ul = div.append('ul').attr('class', 'nav nav-tabs');

                var content = div.append('div').classed('tab-content', true);
                this.model.panes = contentRenderer(content);

                ul.repeat(this.model.panes, function(pane) {
                    this.append('li').bindClassed('active', pane.model.$selected)
                        .append('a').attr('href', '#').text(pane.model.title).on('click', function() {
                            _this.ctrl.select(pane);
                    });
                });

            }
        }
    });
}

function tabPane(parent, title, selected, contentRenderer) {
    return component({

        model: d3bind.observable({
            selected: selected,
            title: title
        }),

        view: {
            render: function() {
                var div = parent.append('div').classed('tab-pane', true).bindClassed('active', this.model.$selected);
                contentRenderer(div);
            }
        }
    });
}