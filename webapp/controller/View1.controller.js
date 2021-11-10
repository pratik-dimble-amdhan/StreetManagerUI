sap.ui.define([
    	"project1/controller/base/BaseController",
	"sap/ui/core/BusyIndicator",
	"sap/m/MessageBox",
	"project1/services/apiFacade",
	"sap/ui/model/json/JSONModel",
	"project1/util/Formatter"
],
	/**
	 * @param {typeof sap.ui.core.mvc.Controller} Controller
	 */
	function (BaseController, BusyIndicator, MessageBox, ApiFacade, JSONModel) {
		"use strict";

		return BaseController.extend("project1.controller.View1", {
			onInit: function () {

            },
            	getRouter: function () {
					return this.getOwnerComponent().getRouter();
				},
            doNavTo: function (sRouteName, oParams) {
					if (oParams) {
						this.getRouter().navTo(sRouteName, oParams);
					} else {
						this.getRouter().navTo(sRouteName);
					}
				},
            press: function (evt) {
			var id = "id";
			var sapkey = "sapkey";
			this.getOwnerComponent().tileClicked = evt.getSource().getHeader();
			if (evt.getSource().getId() === this.createId("createPlanned")) {
				this.getOwnerComponent().getModel("oModel").setProperty("/isPlannedPermit", "planned");
				this.doNavTo("PlannedPermit", {
					mode: "create",
					NAME1: "new",
					PARAM1: "permit"
				});
			} else if (evt.getSource().getId() === this.createId("createFault")) {
				this.getOwnerComponent().getModel("oModel").setProperty("/isPlannedPermit", "IMMEDIATE".toLowerCase());
				this.doNavTo("FaultPermit", {
					mode: "create",
					NAME1: "new",
					PARAM1: "fault"
				});
			}else if (evt.getSource().getId() === this.createId("createInspection")) {
				this.doNavTo("CreateInspection", {
					state: id
				});
			} else if (evt.getSource().getId() === this.createId("InspectionActivities")) {
				this.doNavTo("InspectionActivities");
			} else if (evt.getSource().getId() === this.createId("searchPermits")) {
				this.doNavTo("Search");
			} else if (evt.getSource().getId() === this.createId("searchInspections")) {
				this.doNavTo("Search", {
					tab: "Inspections"
				});
			} else if (evt.getSource().getId() === this.createId("FaultPrivate")) {
				this.getOwnerComponent().getModel("oModel").setProperty("/isPlannedPermit", "private_immediate");
				this.doNavTo("FaultPrivate", {
					mode: "create",
					NAME1: "new",
					PARAM1: "fault"
				});
			} else if (evt.getSource().getId() === this.createId("PlannedPrivate")) {
				this.doNavTo("PlannedPrivate", {
					mode: "create",
					NAME1: "new",
					PARAM1: "permit"
				});
			}else if (evt.getSource().getId() === this.createId("reports")) {
				var sUrl;
				if(this.formatter.checkDevUrl(this.getResourceBundle().getText("environment"))){
					sUrl = this.getResourceBundle().getText("reportingURLdev");
				}else{
					sUrl = this.getResourceBundle().getText("reportingURLprd");
				}
				window.open(sUrl, '_blank');
			}
		}
            
		});
	});
