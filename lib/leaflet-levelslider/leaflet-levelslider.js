L.Control.LevelSlider = L.Control.extend({
    update: function(value){
        return value;
    },

    options: {
        size: '100px',
        position: 'topright',
        id: "lvlslider",
        value: 0,
	levels: [ 0 ],
        title: 'Leaflet Level Slider',
        orientation: 'horizontal',
        getValue: function(value) {
            return value;
        },
        showValue: true
    },
    initialize: function (f, options) {
        L.setOptions(this, options);
        if (typeof f == "function") {
            this.update = f;
        } else {
            this.update = function (value) {
                console.log(value);
            };
        }
        if (typeof this.options.getValue != "function") {
            this.options.getValue = function (value) {
                return value;
            };
        }
        if (this.options.orientation!='vertical') {
            this.options.orientation = 'horizontal';
        }
    },
    onAdd: function (map) {
        this._initLayout();
        this.update(this.options.value+"");
        return this._container;
    },
    _updateValue: function () {
        this.value = this.options.levels[this.slider.noUiSlider.get()];
        if (this.options.showValue){
    	   this._sliderValue.innerHTML = this.options.getValue(this.value);
        }
        this.update(this.value);
    },
    _initLayout: function () {
        var className = 'leaflet-control-lvlslider';
        this._container = L.DomUtil.create('div', className + ' ' +className + '-' + this.options.orientation);

        if (this.options.showValue){
            this._sliderValue = L.DomUtil.create('p', className+'-value', this._container);
            this._sliderValue.innerHTML = this.options.getValue(this.options.value);
        }

        this._sliderContainer = L.DomUtil.create('div', 'leaflet-lvlslider-container', this._container);
	
	//Slider
        this.slider = L.DomUtil.create('div', 'leaflet-lvlslider', this._sliderContainer);
	noUiSlider.create(this.slider, {
		start: 0,
		step: 1,
		orientation: 'vertical',
		height: '100%',
		range: {
			min: 0,
			max: this.options.levels.length - 1
		}
	});
	this.slider.noUiSlider.on('set', function(values, handle) {
		this._updateValue();
	}.bind(this));

        if (this.options.showValue){
            if (window.matchMedia("screen and (-webkit-min-device-pixel-ratio:0)").matches && this.options.orientation =='vertical') {this.slider.style.width = (this.options.size.replace('px','') -36) +'px'; this._sliderContainer.style.height = (this.options.size.replace('px','') -36) +'px';}
            else if (this.options.orientation =='vertical') {this._sliderContainer.style.height = (this.options.size.replace('px','') -36) +'px';}
            else {this._sliderContainer.style.width = (this.options.size.replace('px','') -56) +'px';}
        } else {
            if (window.matchMedia("screen and (-webkit-min-device-pixel-ratio:0)").matches && this.options.orientation =='vertical') {this.slider.style.width = (this.options.size.replace('px','') -10) +'px'; this._sliderContainer.style.height = (this.options.size.replace('px','') -10) +'px';}
            else if (this.options.orientation =='vertical') {this._sliderContainer.style.height = (this.options.size.replace('px','') -10) +'px';}
            else {this._sliderContainer.style.width = (this.options.size.replace('px','') -25) +'px';}
        }

        L.DomEvent.disableClickPropagation(this._container);
    }


});
L.control.levelSlider = function (f, options) {
    return new L.Control.LevelSlider(f, options);
 };
