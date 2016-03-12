
function textDemo1(view) {
    var model = d3bind.observable({ myValue: 'test' });

    view.append('input').attr('type', 'text').attr('value', model.myValue)
        .on('input', function() { model.myValue = this.value; });

    view.append('div').bindText(model.$myValue);
}

function textDemo2(view) {
    var model = d3bind.observable({ myValue: 'test' });

    view.append('input').attr('type', 'text').attr('value', model.myValue)
        .on('input', function() { model.myValue = this.value; });

    view.append('div').bindText(model.$myValue, function(myValue)  { return myValue.toUpperCase(); });
}

function textDemo3(view) {
    var model = d3bind.observable({ a: 2, b: 3 });

    view.append('input').attr('type', 'number').attr('value', model.a)
        .on('input', function() { model.a = parseFloat(this.value); });
    view.append('input').attr('type', 'number').attr('value', model.b)
        .on('input', function() { model.b = parseFloat(this.value); });

    view.append('div').bindText([model.$a, model.$b], function(a, b)  { return a + b; });
}

function otherSelectorBindings(view) {

    var model = d3bind.observable({ state: true });

    view.append('input').attr('type', 'checkbox').property('checked', model.state).on('change', function() {
        model.state = this.checked;
    });

    view.append('div').classed('box', true).bindClassed('red', model.$state);
    view.append('div').classed('box', true).bindStyle('background-color', model.$state,
        function(state) { return state ? 'red' : undefined; });
    view.append('div').classed('box', true).bindAttr('style', model.$state,
        function(state) { return state ? 'background-color: red' : ''; });
    view.append('div').classed('box', true).bindHtml(model.$state,
        function(state) { return state ? '<div style="background-color: red; height: 100%"></div>' : ''; });
    view.append('div').classed('box', true).bindCall(model.$state, function(selection) {
        selection.classed('red', model.state);
    });
    view.append('div').classed('box', true).bind(model.$state, function(state) {
        this.classed('red', state);
    });
    view.append('input').attr('type', 'checkbox').bindProperty('checked', model.$state);
}

function bindInput1(view) {
    var model = d3bind.observable({ myValue: 'test' });

    view.append('input').attr('type', 'text').bindInput(model.$myValue);
    view.append('div').bindText(model.$myValue);
    view.append('button').text('clear').on('click', function() { model.myValue = ''; });
}

function bindInput2(view) {
    var model = d3bind.observable({ myValue: true });

    view.append('input').attr('type', 'checkbox').bindInput(model.$myValue);
    view.append('div').bindText(model.$myValue);
    view.append('button').text('clear').on('click', function() { model.myValue = false; });
}

function bindInput3(view) {
    var model = d3bind.observable({ myValue: 'test' });

    view.append('input').attr('type', 'text').bindInput(model.$myValue);
    view.append('input').attr('type', 'text').bindInput(model.$myValue);
    view.append('div').bindText(model.$myValue);
    view.append('button').text('clear').on('click', function() { model.myValue = ''; });
}

function repeatDemo(view) {
    var data = ['apple', 'orange', 'pear'];

    view.append('ul').repeat(data, function(d, i) {
        this.append('li').text('#' + (i+1) + ' ' + d);
    });
}

function repeatDemo2(view) {
    var data = d3bind.observable(['apple', 'orange', 'pear']);

    view.append('ul').bindRepeat(data, function(d) {
        var li = this.append('li');
        li.append('span').text(d);
        li.append('button').text('X').on('click', function() { data.remove(d); });
    });

    view.append('button').text('Insert random').on('click', function() {
        var index = Math.floor((Math.random() * data.length));
        var item = Math.random().toString(36).substring(7);
        data.insert(index, item);
    });
}

function repeatDemo3(view) {
    var data = d3bind.deepObservable([{ name: 'apple'}, { name: 'orange'}, {name: 'pear'}]);

    view.append('ul').bindRepeat(data, function(d, $i) {
        var li = this.append('li');
        li.append('span').bindText($i, function(i) { return i + 1; });
        li.append('input').attr('type', 'text').bindInput(d.$name);
        li.append('button').text('X').on('click', function() { data.remove(d); });
    });

    view.append('button').text('Insert random').on('click', function() {
        var index = Math.floor((Math.random() * data.length));
        var item = Math.random().toString(36).substring(7);
        data.insert(index, d3bind.observable({ name: item }));
    });

    var footer = view.append('div');
    footer.append('span').text('Count: ');
    footer.append('span').bindText(data.$length);
}

// rare use-case of primitive values with two-way binding
function repeatDemo4(view) {
    var data = d3bind.observable(['apple', 'orange', 'pear']);

    view.append('ul').bindRepeat(data, function($d, $i) {
        var li = this.append('li');
        li.append('input').attr('type', 'text').bindInput($d);
        li.append('button').text('X').on('click', function() { data.remove($d.get()); });
    }, { customReplace: true });

    view.append('button').text('Insert random').on('click', function() {
        var index = Math.floor((Math.random() * data.length));
        var item = Math.random().toString(36).substring(7);
        data.insert(index, item);
    });

    var footer = view.append('div');
    footer.append('span').text('Second item: ');
    footer.append('span').bindText(data.$index(1));
}

function repeatSelection(view) {

    var sequence = 12;
    var data = d3bind.observable([{ id: 10, name: 'apple'}, { id: 11, name: 'orange'}, { id: 12, name: 'pear'}]);
    var selected = d3bind.ObservableMap.bindTo(data, function(item) { return item.id; }, function() { return false; });
    selected.set(11, true);

    view.append('ul').bindRepeat(data, function(d, $i) {
        var li = this.append('li');
        li.append('input').attr('type', 'checkbox').bindInput(selected.$key(d.id));
        li.append('span').text(d.name);
        li.append('button').text('X').on('click', function() { data.remove(d); });
    });

    view.append('button').text('Insert random').on('click', function() {
        var index = Math.floor((Math.random() * data.length));
        var item = Math.random().toString(36).substring(7);
        data.insert(index, { id: ++sequence, name: item });
    });

    // more complicated bindings:

    var selectedCount = new d3bind.ObservableValue(0);
    selected.forEach(function(value) { if (value) selectedCount.set(selectedCount.get() + 1); });
    selected.subscribe({
        insert: function(value) { if(value) selectedCount.set(selectedCount.get() + 1); },
        remove: function(value) { if(value) selectedCount.set(selectedCount.get() - 1); }
    });

    var footer = view.append('div');
    footer.append('span').text('Selected: ');
    footer.append('span').bindText(selectedCount);
    footer.append('span').text(' / ');
    footer.append('span').bindText(data.$length);

    view.append('span').text('Select All: ');
    view.append('input').attr('type', 'checkbox')
        .bindProperty('checked', [selectedCount, data.$length], function(count, dataLength) {
            return count === dataLength;
        })
        .on('change', function() {
            var checked = this.checked;
            selected.forEach(function(value, id) {
                selected.set(id, checked);
            });
        });
}

function redrawDemo(view) {
    var model = d3bind.observable({ myValue: 'test', open: true });

    view.append('div').bindText(model.$myValue);
    view.append('input').attr('type', 'checkbox').bindInput(model.$open);
    view.append('div').bindRedraw(model.$open, function(open) {
         if (open) {
             this.append('input').attr('type', 'text').bindInput(model.$myValue);
         }
    });
}

run(textDemo1);
run(textDemo2);
run(textDemo3);
run(otherSelectorBindings);
run(bindInput1);
run(bindInput2);
run(bindInput3);
run(repeatDemo);
run(repeatDemo2);
run(repeatDemo3);
run(repeatDemo4);
run(repeatSelection);
run(redrawDemo);

function run(func) {
    var view = d3bind.select('#basic-demo').append('div').classed('example-box', true).attr('id', func.name);
    func(view);
}