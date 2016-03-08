
function todoApp(parent) {
    return component({

        model: d3bind.deepObservable({
            todos: [
                {text:'do something', done:true},
                {text:'do something else', done:false}
            ]
        }),

        ctrl: {
            remaining: function() {
                var count = 0;
                this.model.todos.forEach(function(todo) {
                    count += todo.done ? 0 : 1;
                });
                return count;
            },
            archive: function() {
                var _this = this;
                var oldTodos = this.model.todos;
                this.model.todos = new d3bind.ObservableArray();
                oldTodos.forEach(function(todo) {
                    if (!todo.done) _this.model.todos.push(todo);
                });
            },
            addTask: function(task) {
                this.model.todos.push(d3bind.observable(task));
            }
        },

        view: {
            render: function () {
                var _this = this;
                parent.append('div').bindRedraw(this.model.$todos, function(todos, parent) {

                    var donesChanged = _this.model.todos.$all(function(todo) { return todo.$done; });

                    parent.append('h2').text('Todo');
                    parent.append('span').bindText(donesChanged, function() {
                        return _this.ctrl.remaining() + ' of ' + _this.model.todos.length + ' remaining ';
                    });
                    parent.append('span').text('[');
                    parent.append('a').text('archive').on('click', function() { _this.ctrl.archive() });
                    parent.append('span').text(']');

                    todoList(this, _this.model.todos);
                });
                todoForm(parent).outputs.newTask.subscribe(function(newTask) {
                    _this.ctrl.addTask(newTask);
                });
            }
        }
    });
}