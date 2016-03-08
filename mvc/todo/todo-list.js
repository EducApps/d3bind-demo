
function todoList(parent, todos) {
    return component({

        model: {
            todos: todos
        },

        view: {
            render: function() {
                parent.append('ul').classed('list-unstyled', true)
                    .bindRepeat(this.model.todos, function(todo, i) {
                        var li = this.append('li');
                        li.append('input').attr('type', 'checkbox').bindInput(todo.$done);
                        li.append('span').bindClassed('done', todo.$done).bindText(todo.$text);
                    });
            }
        }
    });
}