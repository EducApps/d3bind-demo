function tutorialDemo() {

    var data = d3bind.observable([
        { "id": 3, "created_at": "Sun May 05 2013", "amount": 12000},
        { "id": 1, "created_at": "Mon May 13 2013", "amount": 2000},
        { "id": 2, "created_at": "Thu Jun 06 2013", "amount": 17000},
        { "id": 4, "created_at": "Thu May 09 2013", "amount": 15000},
        { "id": 5, "created_at": "Mon Jul 01 2013", "amount": 16000}
    ]);

    var model = d3bind.observable({ selectedItem: null });

    var format = d3.time.format("%a %b %d %Y");
    var amountFn = function(d) { return d.amount };
    var dateFn = function(d) { return format.parse(d.created_at) };

    var x = d3bind.time.scale()
        .domain(d3.extent(data.array, dateFn))
        .range([10, 280]);

    var y = d3bind.scale.linear()
        .domain(d3.extent(data.array, amountFn))
        .range([180, 10]);

    var view = d3bind.select("#repeat-demo");

    var svg = view.append("svg:svg")
        .attr("width", 300)
        .attr("height", 200);

    svg.append('g').bindRepeat(data, function(d) {
        this.append('svg:circle')
            .attr("r", 4)
            .bindAttr("cx", x.$domain, function() { return x(dateFn(d)); }, { transition: true })
            .bindAttr("cy", y.$domain, function() { return y(amountFn(d)); }, { transition: function(t) { return t.duration(500); } })
            .on("click", function() {
                model.selectedItem = d;
            })
    });

    view.append("button").text('Add')
        .on("click", function() {
            data.push(getNewItem());

            x.domain(d3.extent(data.array, dateFn));
            y.domain(d3.extent(data.array, amountFn));
        });
    view.append('button').text('Remove')
        .on('click', function() {
            data.splice(Math.floor(Math.random() * data.length), 1);

            x.domain(d3.extent(data.array, dateFn));
            y.domain(d3.extent(data.array, amountFn));
        });

    view.append('div')
        .bindText(model.$selectedItem, function(d) { return d ? 'Date: ' + d.created_at + ' amount: ' + d.amount : ''; });

    // demo util:

    function getNewItem() {
        var start = d3.min(data.array, dateFn);
        var end = d3.max(data.array, dateFn);
        var maxAmount = d3.max(data.array, amountFn);

        var date = new Date(start.getTime() + Math.random() * 1.5 * (end.getTime() - start.getTime()));

        return {
            id: Math.floor(Math.random() * 70),
            amount: Math.floor(Math.random() * maxAmount * 1.5),
            created_at: date.toDateString()
        };
    }
}

tutorialDemo();