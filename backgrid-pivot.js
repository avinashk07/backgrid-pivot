(function (root, factory) {

    // CommonJS
    if (typeof exports == "object") {
        (function () {
            module.exports = factory(require("underscore"),
                require("backbone"),
                require("backgrid"),
                require("backgrid/backgrid-patch"),
                require("backgrid/backgrid-sizeable-columns"),
                require("backgrid/backgrid-orderable-columns"),
                require("report/views/splitHeaderCell"),
                require("report/views/report/views/decorated1Cell")
				);
        }());
    } // AMD. Register as an anonymous module.
    else if (typeof define === 'function' && define.amd) {
        define(['underscore', 'backbone', 'backgrid', "backgrid/backgrid-patch", "backgrid/backgrid-sizeable-columns", "backgrid/backgrid-orderable-columns", "report/views/splitHeaderCell", "report/views/decorated1Cell"], factory);
    }
    // Browser
    else {
        factory(root._, root.Backbone, root.Backgrid);
    }

}(this, function (_, Backbone, Backgrid) {

    "use strict";

    var PivotGrid = Backgrid.Extension.PivotGrid = Backgrid.Grid.extend({
		transpose: false,
		pristineCollection: new Backbone.Collection([]),
		initialize: function(options){
			_.extend(this, options || {});
			
			var self = this;
			var verticalColumns, horizontalColumns;
			
			if(this.transpose){
				horizontalColumns = this.collection.verticalColumns;
				verticalColumns = this.collection.horizontalColumns;
				
				this.collection.verticalColumns = verticalColumns;
				this.collection.horizontalColumns = horizontalColumns;
			}else{
				verticalColumns = this.collection.verticalColumns;
				horizontalColumns = this.collection.horizontalColumns;
			}
			
			var models = this.collection.models;
			
			var vcols = this.getHeads(verticalColumns, models, 0);
			var hcols = this.getHeads(horizontalColumns, models, 0);
			
			var derivedColumns = [];
			var lvc = verticalColumns[verticalColumns.length - 1]; //lastVerticalColumn
			var lhc = horizontalColumns[horizontalColumns.length - 1]; //lasthorizontalColumns
			var dc = this.collection.dataColumns[0]; //possibility of multiple data columns
			var column, counter = 0, cells;
			var xPath;
			
			var dfdd = [];
			for(var rrr = 0; rrr < verticalColumns.length - 1; rrr++){
				dfdd.push(verticalColumns[rrr]);
			}
			//vertical columns over horizontal column header
			for(var x = 0; x < horizontalColumns.length; x++){
					
				if(x === horizontalColumns.length -1){
					derivedColumns.push({
						name: "static_" + x, 
						label: _.findWhere(this.columns, {name: horizontalColumns[x]}).label + "#split#" + lvc, 
						nesting: dfdd, 
						order: _.findWhere(this.columns, {name: horizontalColumns[x]}).order, displayOrder: x + 1, 
						sizeable: true, 
						editable: false, 
						headerCell: 'split',
						cell: Backgrid.StringCell.extend({
								tagName: 'th',
								render: function(){
									var model = this.model;
									var column = this.column;
									Backgrid.StringCell.prototype.render.call(this);
									if(!_.isUndefined(model.get(column.get("name") + "rowspan"))){
										this.$el.attr("rowspan", model.get(column.get("name") + "rowspan"));
									}
									//this.$el.attr("style", "background-color: #f9f9f9");//move out
									return this;
								}
							}),
						dataType: _.findWhere(this.columns, {name: horizontalColumns[x]}).dataType,
						sortable: true,
						filterable: true,
						resizeable: true,
						orderable: true
						//headerCell: 'custom' split is being used!!
					});
				}else{
					derivedColumns.push({
						name: "static_" + x, 
						label: _.findWhere(this.columns, {name: horizontalColumns[x]}).label, 
						nesting: dfdd, 
						order: _.findWhere(this.columns, {name: horizontalColumns[x]}).order, displayOrder: x + 1, 
						sizeable: true,
						editable: false,
						cell: Backgrid.StringCell.extend({
								tagName: 'th',
								render: function(){
									var model = this.model;
									var column = this.column;
									Backgrid.StringCell.prototype.render.call(this);
									if(!_.isUndefined(model.get(column.get("name") + "rowspan"))){
										this.$el.attr("rowspan", model.get(column.get("name") + "rowspan"));
									}
									//this.$el.attr("style", "background-color: #f9f9f9");//move out
									return this;
								}
							}),
						dataType: _.findWhere(this.columns, {name: horizontalColumns[x]}).dataType,
						filterable: true,
						sortable: true,
						resizeable: true,
						orderable: true
						//headerCell: 'custom'
					});
				}

			}
			//vertical columns over data
			_.each(vcols, function(group){
				
				_.each(_.keys(group), function(header){
					cells = {};
					xPath = [];
					cells.name = lvc + "_" + counter;
					cells.label = header;
					
					_.each(verticalColumns, function(vc){
						if(vc !== lvc){
							xPath.push(group[header][0].get(vc));
						}
					});
					
					_.each(group[header], function(o){
						cells.xPredicate = _.pick(o.attributes, verticalColumns);
					});
					
					cells.nesting = xPath;
					
					cells.editable = false;
					cells.order = horizontalColumns.length + counter + 1;
					cells.surrogateOrder = _.findWhere(options.columns, {name: dc}).order;
					cells.displayOrder = horizontalColumns.length + counter + 1;
					cells.cell = 'decorated1';
					cells.alignment = _.findWhere(options.columns, {name: dc}).alignment;
					cells.sortable = false;
					cells.filterable = false;
					cells.resizeable = true;
					cells.orderable = true;
					cells.headerCell = 'custom';
					cells.dataType = _.findWhere(options.columns, {name: dc}).dataType;
					cells.drillDown = _.findWhere(options.columns, {name: dc}).drillDown;
					cells.events = _.findWhere(options.columns, {name: dc}).events;
					cells.criteria = _.findWhere(options.columns, {name: dc}).criteria;
					
					derivedColumns.push(cells);
					counter++;
				});
				
			});
			
			//aggregate
			if(self.collection.pivotAggregates.hAggregate){
				cells = {};
				xPath = [];
				cells.name = 'pltf_aggregate';
				cells.label = ''; //header;
				
				/*_.each(verticalColumns, function(vc){
					if(vc !== lvc){
						xPath.push(group[header][0].get(vc));
					}
				});*/
				
				cells.xPredicate = {};
				
				//cells.nesting = xPath;
				
				cells.editable = false;
				cells.order = horizontalColumns.length + counter + 1;
				//cells.surrogateOrder = _.findWhere(options.columns, {name: dc}).order;
				cells.displayOrder = horizontalColumns.length + counter + 1;
				//cells.cell = 'decorated1';
				cells.cell = 'string';//_.findWhere(options.columns, {name: dc}).dataType.toLowerCase();
				cells.headerCell = 'custom';
				cells.sortable = false;
				cells.filterable = false;
				cells.resizeable = true;
				cells.orderable = false;
				cells.dataType = 'string';//_.findWhere(options.columns, {name: dc}).dataType;
				//cells.drillDown = _.findWhere(options.columns, {name: dc}).drillDown;
				//cells.events = _.findWhere(options.columns, {name: dc}).events;
				//cells.criteria = _.findWhere(options.columns, {name: dc}).criteria;
				
				derivedColumns.push(cells);
				
			}
			
			_.each(this.collection.models, function(mod){
				self.pristineCollection.add(new Backbone.Model(mod.attributes));
			});
			
			
			var derivedModels = [], prev = new Array(horizontalColumns.length - 1), rs = new Array(horizontalColumns.length - 1), yPredicate, tempAttr;
			//horizontal columns & data
			_.each(hcols, function(group){
				_.each(_.keys(group), function(header){//an iteration will generate a row
					cells = {};
					xPath = [];
					yPredicate = {};
					yPredicate[lhc] = header;
					
					
					_.each(horizontalColumns, function(hc){
						if(hc !== lhc){
							xPath.push(group[header][0].get(hc));
						}
					});
					
					for(var ff = horizontalColumns.length - 2; ff >= 0; ff--){
						if(!_.isUndefined(prev[ff]) && prev[ff] === group[header][0].get(horizontalColumns[ff]) && (_.isUndefined(prev[ff - 1]) || prev[ff - 1] === group[header][0].get(horizontalColumns[ff - 1]))){
							cells["static_" + ff + "rowspan"] = -1;
							derivedModels[rs[ff]].set("static_" + ff + "rowspan", derivedModels[rs[ff]].get("static_" + ff + "rowspan") + 1);
						}else{
							prev[ff] = group[header][0].get(horizontalColumns[ff]);
							rs[ff] = derivedModels.length;
							cells["static_" + ff + "rowspan"] = 1;
						}
						cells["static_" + ff] = group[header][0].get(horizontalColumns[ff]);
						yPredicate[horizontalColumns[ff]] = prev[ff];
					}
					
					cells['static_' + (horizontalColumns.length - 1)] = header;
					cells.nesting = xPath;
					
					_.each(derivedColumns, function(derivedColumn){
						if(derivedColumn.name === 'pltf_aggregate'){
							cells[derivedColumn.name] = _.findWhere(self.collection.pivotAggregates.hAggregate.data, _.extend({}, derivedColumn.xPredicate, yPredicate)) ? _.findWhere(self.collection.pivotAggregates.hAggregate.data, _.extend({}, derivedColumn.xPredicate, yPredicate))[dc] : "";
						}else if(derivedColumn.name.indexOf("static_") !== 0){
							cells[derivedColumn.name] = self.collection.findWhere(_.extend({}, derivedColumn.xPredicate, yPredicate)) ? self.collection.findWhere(_.extend({}, derivedColumn.xPredicate, yPredicate)).get(dc) : "";
							
							cells[derivedColumn.name + "_cid"] = self.pristineCollection.findWhere(_.extend({}, derivedColumn.xPredicate, yPredicate)) ? 
									self.pristineCollection.findWhere(_.extend({}, derivedColumn.xPredicate, yPredicate)).cid : "";					
						}
					});
					
					derivedModels.push(new Backbone.Model(cells));
				});
			});
			
			this.collection.remove(this.collection.models, {silent: true});
			this.collection.push(derivedModels);
			this.collection.src = this.pristineCollection;
			
			options.columns = new Backgrid.Extension.OrderableColumns.orderableColumnCollection(derivedColumns);
			options.collection = this.collection;
			
			Backgrid.Grid.prototype.initialize.call(this, options);
		},
		getHeads: function(heads, records, i){
			var self = this;
			var gi;
			if(i === 0){
				gi = _.groupBy(records, function(record){
					return record.get(heads[i]);
				});
			}else{
				gi = [];
				_.each(records, function(record){
					var keysGi = _.keys(record);
					_.each(keysGi, function(keyGi){
					  gi[gi.length]= _.groupBy(record[keyGi], function(gj){
						  return gj.get(heads[i]);
					  });
					});
				});
			}
			
			gi = !_.isArray(gi) ? [gi] : gi;//enclose in array
			
			i++;
			if(i < heads.length){
				gi = this.getHeads(heads, gi, i);
			}
			//console.log(gi);
			return gi;
		}
    });
	return PivotGrid;
}));