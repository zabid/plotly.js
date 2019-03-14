/**
* Copyright 2012-2019, Plotly, Inc.
* All rights reserved.
*
* This source code is licensed under the MIT license found in the
* LICENSE file in the root directory of this source tree.
*/

'use strict';

var overrideAll = require('../../plot_api/edit_types').overrideAll;
var getModuleCalcData = require('../../plots/get_data').getModuleCalcData;
var plot = require('./plot');
var fxAttrs = require('../../components/fx/layout_attributes');

var setCursor = require('../../lib/setcursor');
var dragElement = require('../../components/dragelement');
var prepSelect = require('../../plots/cartesian/select').prepSelect;

var SANKEY = 'sankey';

exports.name = SANKEY;

exports.baseLayoutAttrOverrides = overrideAll({
    hoverlabel: fxAttrs.hoverlabel
}, 'plot', 'nested');

exports.plot = function(gd) {
    var calcData = getModuleCalcData(gd.calcdata, SANKEY)[0];
    plot(gd, calcData);
};

exports.clean = function(newFullData, newFullLayout, oldFullData, oldFullLayout) {
    var hadPlot = (oldFullLayout._has && oldFullLayout._has(SANKEY));
    var hasPlot = (newFullLayout._has && newFullLayout._has(SANKEY));

    if(hadPlot && !hasPlot) {
        oldFullLayout._paperdiv.selectAll('.sankey').remove();
    }
};

exports.updateFx = function(gd) {
    var fullLayout = gd._fullLayout;
    var bgRect = fullLayout._bgRect;
    var dragMode = fullLayout.dragmode;
    var clickMode = fullLayout.clickmode;

    var cursor = fullLayout.dragmode === 'pan' ? 'move' : 'crosshair';
    setCursor(fullLayout._draggers, cursor);

    var fillRangeItems;

    if(dragMode === 'select') {
        fillRangeItems = function(eventData, poly) {
            var ranges = eventData.range = {};
            // ranges[_this.id] = [
            //     invert([poly.xmin, poly.ymin]),
            //     invert([poly.xmax, poly.ymax])
            // ];
            console.log(poly);
        };
    } else if(dragMode === 'lasso') {
        fillRangeItems = function(eventData, poly, pts) {
            // var dataPts = eventData.lassoPoints = {};
            // dataPts[_this.id] = pts.filtered.map(invert);
        };
    }

    var xaxis = {
        _id: 'x',
        c2p: function(v) { return v; },
        _offset: bgRect.node().getAttribute('x'),
        _length: gd._fullLayout.width
    };
    var yaxis = {
        _id: 'y',
        c2p: function(v) { return v; },
        _offset: bgRect.node().getAttribute('y'),
        _length: gd._fullLayout.height
    };

    // Note: dragOptions is needed to be declared for all dragmodes because
    // it's the object that holds persistent selection state.
    var dragOptions = {
        gd: gd,
        element: bgRect.node(),
        plotinfo: {
            xaxis: xaxis,
            yaxis: yaxis,
            fillRangeItems: fillRangeItems
        },
        // create mock x/y axes for hover routine
        xaxes: [xaxis],
        yaxes: [yaxis]
    };

    dragOptions.prepFn = function(e, startX, startY) {
        prepSelect(e, startX, startY, dragOptions, dragMode);
    };

    dragElement.init(dragOptions);
};
