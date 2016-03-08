
function todoForm(parent) {
    return component({

        model: d3bind.observable({
            task: ''
        }),

        ctrl: {
            addTodo: function() {
                if (this.model.task) {
                    this.outputs.newTask.set({text: this.model.task, done: false });
                }
                this.model.task = '';
            }
        },

        view: {
            render: function() {
                var _this = this;
                var form = parent.append('form').on('submit', function() {
                    _this.ctrl.addTodo();
                    d3.event.preventDefault();
                });
                form.append('input').attr('type', 'text').attr('placeholder', 'add new todo here').attr('size', 30)
                    .bindInput(this.model.$task);
                form.append('input').attr('class', 'btn-primary').attr('type', 'submit').attr('value', 'add');
            }
        },

        outputs: {
            newTask: new d3bind.ObservableValue()
        }
    });
}