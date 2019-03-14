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
var Lib = require('../../lib');
var Plotly = require('../../plot_api/plot_api');

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

var oldDragOptions;
var dragOptions;
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
            var oldGroups = gd._fullData[0].node.groups.slice();
            var nodes = gd._fullData[0]._sankey.graph.nodes;
            for(var i = 0; i < nodes.length; i++) {
                var node = nodes[i];
                if(node.partOfGroup) continue; // Those are invisible
                var doNotOverlap = poly.xmin > node.x1 || poly.xmax < node.x0 || poly.ymin > node.y1 || poly.ymax < node.y0;
                if(!doNotOverlap) {
                    // If the node represents a group
                    if(node.group) {
                        // Add all its children to the current selection
                        for(var j = 0; j < node.childrenNodes.length; j++) {
                            eventData.points.push(node.childrenNodes[j].pointNumber);
                        }
                        // Remove it from the existing list of groups
                        oldGroups[node.pointNumber - gd._fullData[0].node._count] = false;
                    } else {
                        eventData.points.push(node.pointNumber);
                    }
                }
            }
            var newGroups = oldGroups.filter(function(g) { return g;}).concat([eventData.points]);
            return Plotly._guiRestyle(gd, 'node.groups', [ newGroups ]).catch(function() {});
        };
    } else if(dragMode === 'lasso') {
        Lib.warn('Lasso mode is not yet supported.');
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
    oldDragOptions = dragOptions;
    dragOptions = Lib.extendDeep(oldDragOptions || {}, {
        gd: gd,
        element: bgRect.node(),
        plotinfo: {
            id: 'here', // TODO: use uid
            xaxis: xaxis,
            yaxis: yaxis,
            fillRangeItems: fillRangeItems
        },
        // create mock x/y axes for hover routine
        xaxes: [xaxis],
        yaxes: [yaxis],
        clickFn: function(numClicks) {
            if(numClicks === 2) {
                return Plotly._guiRestyle(gd, 'node.groups', [[[]]]);
            }
        }
    });

    dragOptions.prepFn = function(e, startX, startY) {
        prepSelect(e, startX, startY, dragOptions, dragMode);
    };

    dragElement.init(dragOptions);
};
