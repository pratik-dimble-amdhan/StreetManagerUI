sap.ui.define([
	"project1/controller/base/BaseController",
	"project1/util/Formatter",
	"sap/ui/model/json/JSONModel"
], function (BaseController, Formatter, JSONModel) {
	"use strict";

	return BaseController.extend("project1.controller.PermitSubmit", {
		formatter: Formatter,
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("PermitSubmit").attachPatternMatched(this.onRoutemacth, this);
		},

		onRoutemacth: function () {
			// console.log(this.getOwnerComponent().getModel("oModel").getProperty("/isErrorLocation"));
			// console.log(this.getOwnerComponent().getModel("oModel").getProperty("/isErrorFault"));
			// console.log(this.getOwnerComponent().getModel("oModel").getProperty("/isNavigationFault"));
			// console.log(this.getOwnerComponent().getModel("oModel").getProperty("/isErrorLocation"));
			if (this.getOwnerComponent().getModel("oModel").getProperty("/isErrorLocation") || this.getOwnerComponent().getModel("oModel").getProperty(
					"/isErrorFault")) {
				this.getView().byId("idSuccess").setVisible(false);
				this.getView().byId("idBoxSuccess").setVisible(true);
				this.getView().byId("idError").setVisible(true);
				this.getView().byId("idBoxError").setVisible(true);
			} else {
				this.getView().byId("idSuccess").setVisible(true);
				this.getView().byId("idBoxSuccess").setVisible(false);
				this.getView().byId("idError").setVisible(false);
				this.getView().byId("idBoxError").setVisible(false);
			}
		},

		// createPermitModel: function () {
		// 	var data;
		// 	var tile = this.getOwnerComponent().tileClicked.toLowerCase();
		// 	if (tile === "Register Permit".toLowerCase()) {
		// 		data = {
		// 			Permit: false,
		// 			Register: true,
		// 			ReportingBtn: false,
		// 			SearchPermitBtn: true,
		// 			HomeBtn: true,
		// 			PermitSubmitBtn: false,
		// 			FaultSubmitBtn: false
		// 		};
		// 	} else if (tile === "Create Permit".toLowerCase() || tile === "Fault Permit".toLowerCase()) {
		// 		if (this.getOwnerComponent().getModel("oModel").getProperty("/isNavigationFault")) {
		// 			data = {
		// 				Permit: true,
		// 				Register: false,
		// 				ReportingBtn: true,
		// 				SearchPermitBtn: true,
		// 				HomeBtn: true,
		// 				PermitSubmitBtn: false,
		// 				FaultSubmitBtn: true
		// 			};
		// 		} else {
		// 			data = {
		// 				Permit: true,
		// 				Register: false,
		// 				ReportingBtn: false,
		// 				SearchPermitBtn: false,
		// 				HomeBtn: true,
		// 				PermitSubmitBtn: true,
		// 				FaultSubmitBtn: false
		// 			};
		// 		}
		// 	}
		// 	var model = new JSONModel(data);
		// 	this.getView().setModel(model, "PermitModel");
		// },

		// Export to PDF
		onExport: function () {
			var doc = new jsPDF();
			var sPrintId = "#" + this.getOwnerComponent().sPrintId;
			if ($(sPrintId)[0]) {
				var elementHTML = $(sPrintId)[0];
				// console.log(elementHTML);
				doc.fromHTML(elementHTML);
				doc.addPage();
				doc.save("Summary.pdf");
			}
		},

		onCreatePermit: function () {
			var sapkey = "sapkey";
			if (this.getView().getModel("oModel").getProperty("/isNavigationFault")) {
				this.doNavTo("FaultPermit", {
					mode: "create",
					NAME1: "new",
					PARAM1: "fault"
				});
			} else {
				this.doNavTo("PlannedPermit", {
					mode: "create",
					NAME1: "new",
					PARAM1: "permit"
				});
			}
		},

		onBackHome: function () {
			this.oRouter.navTo("RouteHome");
		},

		onSearchPermit: function () {
			this.doNavTo("Search");
		},

		onCreatePrivateFault: function () {
			this.doNavTo("FaultPrivate", {
				mode: "create",
				NAME1: "new",
				PARAM1: "fault"
			});
		},

		onReportPress: function(){
			var sUrl;
			if(this.formatter.checkDevUrl(this.getResourceBundle().getText("environment"))){
				sUrl = this.getResourceBundle().getText("reportingURLdev");
			}else{
				sUrl = this.getResourceBundle().getText("reportingURLprd");
			}
			window.open(sUrl, '_blank');
		}

	});

});