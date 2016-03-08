
function component(spec) {
    if (spec.ctrl) {
        spec.ctrl.model = spec.model;
        spec.ctrl.view = spec.view;
        spec.ctrl.outputs = spec.outputs;
    }
    spec.view.ctrl = spec.ctrl;
    spec.view.model = spec.model;
    spec.view.outputs = spec.outputs;

    spec.view.render.call(spec);

    return spec;
}