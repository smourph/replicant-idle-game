// Game is a global object. It is unique and can be called from wherever in the code.
var Game = {
    interval: 10,     // time between each tick (in ms)
    decimals: 0,      // Number of decimals displayed, 0 for just integers

    scraps: 0,      // scraps owned

    // DOM elements
    button: undefined,
    countDisplay: undefined,
    store: undefined,
    cpsDisplay: undefined,

    // This is the handle for the setInterval.
    // It is good practice to keep it stored somewhere, if only to be able
    // to stop it with window.clearInterval(Game.handle)
    handle: undefined,

    // The possible buildings will be stored in this array
    buildings: [],

    init: function (_buildings) {
        var self = this;

        // -- Cache DOM elements
        // (traversing the DOM with jQuery is costly on large pages, so it is recommended
        // to call static elements just once and store them for future use. Also makes for some
        // more readable code)
        this.button = $('#produce-scrap');
        this.countDisplay = $('#scrap-quantity');
        this.robots = $('#robots-container');
        this.cpsDisplay = $('#sps');

        // bind the click event
        this.button.click(function () {
            self._click();
        });

        // -- Initialize all buildings and store them in the buildings array
        $.each(_buildings, function (i, _building) {
            var newBuilding = Building(_building).init(i);
            self.buildings.push(newBuilding);
        });

        // Launch the ticker
        this.handle = window.setInterval(function () {
            self._tick();
        }, this.interval);
    },

    // called each time you click
    _click: function () {
        this.scraps++;
    },

    // called at each tick
    _tick: function () {
        // Each building produces his currency, and then we check
        // if we have enough to buy another (ie reactivate the button)
        $.each(this.buildings, function (i, building) {
            building.produce();
            building.updateQuantity();
            building.updateCps();
            building.checkButton();
        });
        this.updateCps();

        // Update the currency we have. toFixed() is used to round to n decimals
        this.countDisplay.text(this.displayNumber(this.scraps));
    },

    // calculates and displays the current CPS
    updateCps: function () {
        var cps = 0;

        // calculates
        $.each(this.buildings, function (i, building) {
            cps += building.production * building.quantity;
        });

        // displays
        this.cpsDisplay.text(this.displayNumber(cps));
    },

    displayNumber: function (value) {
        return value.toFixed(this.decimals);
    }
};


var Building = function (options) {
    return $.extend({
        id: 0,
        quantity: 0,
        increase: 1.5,
        button: undefined,
        countDisplay: undefined,
        cps: undefined,
        productionTarget: null,

        // at each tick, every building produces his cps
        produce: function () {
            if (this.productionTarget !== null) {
                Game.buildings[this.productionTarget].quantity += this.quantity * this.production * Game.interval / 1000;
            } else {
                Game.scraps += this.quantity * this.production * Game.interval / 1000;
            }
        },

        // activates the button if we have enough currency to buy this building
        updateQuantity: function () {
            this.countDisplay.text(Game.displayNumber(this.quantity));
        },

        // activates the button if we have enough currency to buy this building
        updateCps: function () {
            var cps = 0;

            // calculates
            var self = this;
            $.each(Game.buildings, function (i, building) {
                if (building.productionTarget === self.id) {
                    cps += building.production * building.quantity;
                }
            });

            // displays
            this.cpsDisplay.text(Game.displayNumber(cps));
        },

        // activates the button if we have enough currency to buy this building
        checkButton: function () {
            if (this.cost > Game.scraps) {
                this.button.attr("disabled", "disabled");
            } else {
                this.button.removeAttr("disabled");
            }
        },

        // buys this building
        buy: function () {
            Game.scraps -= this.cost;

            this.quantity++;
            this.cost = Math.ceil(this.cost * this.increase);
            this.button.text("Build (" + this.cost + ")");
        },

        // initialize a robot
        init: function (i) {
            this.id = i;
            this.countDisplay = $('<span>').attr('id', 'robot-' + i + '-quantity').text(0);
            this.cpsDisplay = $('<span>').attr('id', 'robot-' + i + '-cps').text(0);
            var body = $('<div>').addClass('robots__panel__body').text(this.name + ': ')
                .append(this.countDisplay)
                .append(' (')
                .append(this.cpsDisplay)
                .append('/s)');
            var info = $('<div>').addClass('robots__panel__info')

            // Init production target
            if (i > 0 || this.type === 'replicant') {
                this.productionTarget = i - 1;
                info.text('Build 1 ' + _buildings[this.productionTarget].name + ' / s');
            } else {
                this.productionTarget = null;
                info.text('Build 1 scrap / s');
            }

            // create DOM elements
            var self = this;
            this.button = $('<button>').addClass('robots__panel__button').text('Build (' + this.cost + ' scraps)')
                .click(function () {
                    self.buy();
                });
            this.element = $('<div>').addClass('robots__panel')
                .append(body)
                .append(info)
                .append(this.button);

            // display the button
            Game.robots.append(this.element);

            // check if the button should be activated
            this.checkButton();

            // we return this, so the whole Building object we just initialized can be stored
            // in the Game.buildings array
            return this;
        }
    }, options);
};

// Here we define the different buildings.
// note that adding a building is as simple as adding an object inside this array
_buildings = [
    {
        name: "Replicant Alpha",
        cost: 10,
        production: 1,
        type: 'worker'
    },
    {
        name: "Replicant Beta",
        cost: 150,
        production: 1,
        type: 'replicant'
    },
    {
        name: "Replicant Gamma",
        cost: 2500,
        production: 1,
        type: 'replicant'
    },
    {
        name: "Replicant Delta",
        cost: 50000,
        production: 1,
        type: 'replicant'
    },
    {
        name: "Replicant Epsilon",
        cost: 2000000,
        production: 1,
        type: 'replicant'
    }
];

// Initialize the Game
Game.init(_buildings);
