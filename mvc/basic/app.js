
function helloWorld(parent) {
    return component({

        model: d3bind.observable({yourName: ''}),

        view: {
            render: function () {
                parent.append('label').text('Name: ');
                parent.append('input').attr('type', 'text').attr('placeholder', 'Enter a name here')
                    .bindInput(this.model.$yourName);
                parent.append('hr');
                parent.append('h1')
                    .bindStyle('display', this.model.$yourName, name => name ? 'initial' : 'none' )
                    .bindText(this.model.$yourName, name => 'Hello ' + name);
            }
        }
    });
}

window.onload = function() {
    helloWorld(d3bind.select('body'));
};
