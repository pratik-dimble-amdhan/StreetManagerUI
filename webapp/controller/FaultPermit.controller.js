sap.ui.define([
	"project1/controller/base/BaseController",
	"jquery.sap.global",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/m/MessageBox",
	"project1/util/Formatter",
	"sap/ui/core/BusyIndicator",
    "sap/m/MessageToast",
    "project1/services/apiFacade",
    
], function (BaseController, jQuery, JSONModel, MessagePopover, MessagePopoverItem, MessageBox, Formatter, BusyIndicator,
	MessageToast,ApiFacade) {
	"use strict";

	return BaseController.extend("project1.controller.FaultPermit", {
		formatter: Formatter,
		Specialdesignations: false,
		CheckIncident: null,
		CompareIncident: null,
		aOldTrafficAttachments: [],
		aOldAttachments: [],
		AlterapplicationID: null,
		alterationId: null,
		argumentName: null,
		GroupPersonresponsible: null,
		Alterchange: null,
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("FaultPermit").attachPatternMatched(this.onRoutemacth, this);
			// this.oRouter.getRoute("EditFaultPermit").attachPatternMatched(this.onRoutemacth, this);
		},

		onRoutemacth: function (evt) {
			this.permitMode = evt.getParameter("arguments").mode;
				//This Condition is used when the Permit status is refused
			if (this.getView().getModel("ExtendPermitModel").oData.data != undefined && this.getView().getModel("ExtendPermitModel").oData.data.status !== undefined && this.getView().getModel("ExtendPermitModel").oData
				.data.status !== null) {
				this.PermitStatus = this.getView().getModel("ExtendPermitModel").oData.data.status;
			} else {
				this.PermitStatus = "";
			}
			//**********End of the Changes *****************************************
			this.draftAlterationId = null;
			this.alterationId = null;
			this.AlterapplicationID = null;
			this.Alterchange = null;
			this.getView().getModel("oModel").setProperty("/isNavigationFault", false);
			this.getView().getModel("oModel").setProperty("/isPrivateFault", false);
		//	this.assesmentStatus = this.getView().getModel("oModel").getData().ApplicationDetails.assessmentStatus;
			this.clearData();
			this.setDevicewidth();
			this._getInitialData();
			this.createSummaryModel();
			this._getSpecialDesignationData();
			if (this.permitMode === "edit") {
				this.getView().getModel("oModel").setProperty("/permitMode", "Edit");
			} else if (this.permitMode === "InternalEdit") {
				this.getView().getModel("oModel").setProperty("/permitMode", "Internal edit");
			} else if (this.permitMode === "AlterPermit") {
				this.getView().getModel("oModel").setProperty("/permitMode", "Alter");
			} else if (this.permitMode === "create") {
				this.getView().getModel("oModel").setProperty("/permitMode", "Create");
			}
			this.argumentName = evt.getParameter("arguments").NAME1;
			this.getView().getModel("oModel").setProperty("/ETONedit", false);
			this.byId("idFaultDiscard").setVisible(false);
			if (this.permitMode === "create") {
				if (evt.getParameter("arguments").NAME1 === "PermitReference") {
					this.getApplicationDetails(evt.getParameter("arguments").PARAM1);
				}else{
					this.getView().getModel("oModel").setProperty("/ETONedit", true);
				}
			}

			if (this.permitMode === "edit") {
				this.byId("idFaultDiscard").setVisible(true);
			}

			if (this.permitMode === "edit" || this.permitMode === "InternalEdit") {
				// if (evt.getParameter("arguments").NAME1 === "PermitReference" || evt.getParameter("arguments").NAME1 === "ApplicationId") {
				if (evt.getParameter("arguments").NAME1 === "ApplicationId") {
					this.getApplicationDetails(evt.getParameter("arguments").PARAM1);
				}
			}

			if (this.permitMode === "AlterPermit") {
				if (evt.getParameter("arguments").NAME1 === "PermitReference" || evt.getParameter("arguments").NAME1 === "ApplicationId") {
					if (evt.getParameter("arguments").PARAM1.indexOf("_AlterationId=") !== -1) {
						this.byId("idFaultDiscard").setVisible(true);
						this.AlterapplicationID = evt.getParameter("arguments").PARAM1.split("_AlterationId=")[0];
						this.alterationId = evt.getParameter("arguments").PARAM1.split("_AlterationId=")[1].split("&")[0];
						this.draftAlterationId = evt.getParameter("arguments").PARAM1.split("_AlterationId=")[1].split("&")[1];
						this.getApplicationDetails(this.alterationId);
					} else {
						this.getApplicationDetails(evt.getParameter("arguments").PARAM1);
					}
				}
			}
			this.getView().getModel("oModel").setProperty("/workoperationno", "0030");
		},

		setDevicewidth: function () {
			if (sap.ui.Device.resize.width === 1280) {
				this.getView().byId("navCon").setHeight("19em");
			} else if (sap.ui.Device.resize.width >= 1024) {
				this.getView().byId("navCon").setHeight("42em");
			} else {
				this.getView().byId("navCon").setHeight("70em");
			}
		},

		onAfterRendering: function () {
			// this.getView().getModel().setProperty("workstartandtime", this.getView().byId("DTP1").getDateValue());
		},

		onHome: function (evt) {
			if (evt === "home") {
				MessageBox.confirm(
					"Do you want to navigate to Home page? If Ok all unsaved data lost.", {
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						onClose: function (oAction) {
							if (oAction === MessageBox.Action.OK) {
								this.clearData();
								this.oRouter.navTo("RouteHome", null, true);
							}
						}.bind(this)
					}
				);
			} else if (evt === "cancel" || evt === "close") {
				if (this.permitMode === "InternalEdit") {
					var permitReferenceNumber = this.getView().getModel("oModel").getData().isApplicationId.applicationId;
					this.doNavTo("PermitHistory", {
						tab: "Permitdetails",
						NAME1: "requestId",
						PARAM1: permitReferenceNumber
					});
				} else {
					MessageBox.confirm(
						"Do you want to cancel the application? If cancelled all unsaved data lost.", {
							actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
							onClose: function (oAction) {
								if (oAction === MessageBox.Action.OK) {
									this.clearData();
									this.oRouter.navTo("RouteHome", null, true);
								}
							}.bind(this)
						}
					);
				}
			}
		},

		onPress: function (oEvent) {
			sap.m.MessageToast.show("Pressed custom button " + oEvent.getSource().getId());
		},

		onMessagesButtonPress: function (oEvent) {
			var oMessagesButton = this.getView().byId("messagePopoverBtn");
			if (!this._messagePopover) {
				this._messagePopover = new MessagePopover({
					initiallyExpanded: false,
					items: {
						path: "oModel>/Notifications",
						template: new sap.m.MessageItem({
							description: "{oModel>description}",
							type: "{oModel>type}",
							title: "{oModel>description}",
							subtitle: "{oModel>subtitle}"
						})
					}
				});
				oMessagesButton.addDependent(this._messagePopover);
			}
			this._messagePopover.toggle(oMessagesButton);
		},

		getContractorAll: function () {
			var oPromise = ApiFacade.getInstance().getContractorAll();
			oPromise.then(function (data) {
				var primaryContractor = data.filter(function (param) {
					return param.primary === true;
				});
				var secondaryContractor = data.filter(function (param) {
					return param.secondary === true;
				});
				var tmContractor = data.filter(function (param) {
					return param.tm === true;
				});
				var otherContractor = data.filter(function (param) {
					return param.other === true;
				});
				this.getView().getModel("oModel").setProperty("/primaryContractor", primaryContractor);
				this.getView().getModel("oModel").setProperty("/secondaryContractor", secondaryContractor);
				this.getView().getModel("oModel").setProperty("/tmContractor", tmContractor);
				this.getView().getModel("oModel").setProperty("/otherContractor", otherContractor);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},

		getTrafficManagement: function () {
			var oPromise = ApiFacade.getInstance().getTrafficManagement();
			oPromise.then(function (oData) {
				this.getView().getModel("oModel").setProperty("/trafficManagementType", oData);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},
		getOperationalZone: function () {
			var oPromise = ApiFacade.getInstance().getOperationalZone();
			oPromise.then(function (data) {
				var uniqueArray = [];
				var filterArray = [];
				for (var i = 0; i < data.length; i++) {
					if (uniqueArray.indexOf(data[i].dno) === -1) {
						uniqueArray.push(data[i].dno);
						filterArray.push(data[i]);
					}
				}
				this.getView().getModel("oModel").setProperty("/allData", data);
				this.getView().getModel("oModel").setProperty("/operationalZone", filterArray);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},

		getCollaborationType: function () {
			var oPromise = ApiFacade.getInstance().getCollaborationType();
			oPromise.then(function (data) {
				this.getView().getModel("oModel").setProperty("/collaborationType", data);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},

		getLocationType: function () {
			var oPromise = ApiFacade.getInstance().getLocationType();
			oPromise.then(function (data) {
				this.getView().getModel("oModel").setProperty("/locationType", data);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},

		getSelectedLocation: function (highwayNo) {
			$.ajax({
				type: "GET",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/street-lookup/search/" + highwayNo,
				async: false,
				contentType: "application/json",
				success: function (odata, xhr) {
					this.getView().byId("Usrn").setValueState("None");
					this.removeNotification("USRN");

					this.getView().getModel("oModel").setProperty("/roadCategory", odata.roadCategory);
					this.getView().getModel("oModel").setProperty("/area", odata.area);
					this.getView().getModel("oModel").setProperty("/town", odata.town);
					this.getView().getModel("oModel").setProperty("/street", odata.streetDescriptor);
					this.getView().getModel("oModel").setProperty("/trafficSensitive", odata.trafficSensitive);
					var address;
					if (!odata.area) {
						address = odata.streetDescriptor + ", " + odata.town;
					} else if (!odata.streetDescriptor) {
						address = odata.area + ",  " + odata.town;
					} else if (!odata.town) {
						address = odata.streetDescriptor + ", " + odata.area;
					} else {
						address = odata.streetDescriptor + ", " + odata.area + ", " + odata.town;
					}
					this.getView().getModel("oModel").setProperty("/selectedLocation", address);

					var HighwayAuthorityArray = [];
					HighwayAuthorityArray = odata.primaryNoticeAuthorities;
					HighwayAuthorityArray.forEach(function (val) {
						if (val.name === "") {
							val.name = val.locationDescription;
						} else if (val.locationDescription === "") {
							val.name = val.name;
						} else {
							val.name = val.name + " - " + val.locationDescription;
						}
					});
					this.getView().getModel("oModel").setProperty("/highwayAuthority", HighwayAuthorityArray);

					if (odata.primaryNoticeAuthorities.length > 1) {
						if (this.argumentName === "PermitReference" || this.argumentName === "ApplicationId") {
							this.getView().byId("multipleHighWay").setVisible(false);
							// this.getView().byId("multipleHighWayLocation").setVisible(false);
							this.getView().byId("idHighwayAuthBox").setEnabled(false);
						} else {
							this.getView().byId("multipleHighWay").setVisible(true);
							// this.getView().byId("multipleHighWayLocation").setVisible(true);
							this.getView().byId("idHighwayAuthBox").setEnabled(true);
						}

					} else {
						this.getView().byId("multipleHighWay").setVisible(false);
						// this.getView().byId("multipleHighWayLocation").setVisible(false);
						this.getView().byId("idHighwayAuthBox").setSelectedItem(this.getView().byId("idHighwayAuthBox").getItems()[0]);
						this.getView().byId("idHighwayAuthBox").setEnabled(false);
						if (this.getView().byId("idHighwayAuthBox").getSelectedItem() !== null) {
							this.removeNotification("HighwayAuthority");
							this.getView().byId("idHighwayAuthBox").setValueState("None");
						}
					}
					this.getView().getModel("oModel").setProperty("/specialDesignation", []);
					this.getView().getModel("oModel").setProperty("/specialDesignation", odata.additionalSpecialDesignations);
					this.getView().getModel("oModel").setProperty("/LaneRentalFlag", false);
					if (odata.additionalSpecialDesignations.length === 0) {
						this.getView().byId("idDesignationList").setVisible(false);
						this.getView().byId("specailDesignation").setVisible(false);
						this.getView().byId("allDesignationSelector").setVisible(false);
					} else {
						odata.additionalSpecialDesignations.forEach(function (oDesignation) {
							if (oDesignation.street_special_desig_code === 16) {
								this.getView().getModel("oModel").setProperty("/LaneRentalFlag", true);
							}
						}.bind(this));
						this.getView().byId("idDesignationList").setVisible(true);
						this.getView().byId("specailDesignation").setVisible(true);
						this.getView().byId("allDesignationSelector").setVisible(true);
					}
					// this.getView().getModel("oModel").setProperty("/moreInfo",odata.additionalSpecialDesignations);

					this.getView().getModel("oModel").setProperty("/SelectedLocation", odata);
					this.getView().getModel("oModel").refresh(true);
					if (this.getView().getModel("oModel").getData().ApplicationDetails.length !== 0) {
						this._setSpecialDesignations();
					}
					// console.log(this.getView().getModel("oModel").getData());
					// sap.m.MessageToast.show("Success");
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}
			});
		},

		getFootwayClosure: function () {
			var oPromise = ApiFacade.getInstance().getFootwayClosure();
			oPromise.then(function (data) {
				this.getView().getModel("oModel").setProperty("/footwayclosure", data);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},

		getWorkIdentifier: function () {
			var oPromise = ApiFacade.getInstance().getWorkIdentifier();
			oPromise.then(function (data) {
				var workIdentifier = data.filter(function (val) {
					return val.departmentId === 1;
				});
				this.getView().getModel("oModel").setProperty("/workIdentifier", workIdentifier);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},

		handlesubmitUSRN: function (evt) {
			// this.gethighwayAuthority(evt.getParameter("value"));
			this.getView().getModel("oModel").setProperty("/usrn", evt.getParameter("value"));
			this.getSelectedLocation(evt.getParameter("value"));
		},
		onPressLink: function (evt) {
			if (evt.getSource().getText() === "Add Permit Conditions") {
				this.getView().byId("idLinkPermit").setText("Hide permit conditions");
				this.getView().byId("idFaultPermitList").setVisible(true);
			} else {
				this.getView().byId("idLinkPermit").setText("Add Permit Conditions");
				this.getView().byId("idFaultPermitList").setVisible(false);
			}
		},
		handleChange: function (oEvent) {
			this.getView().byId("WorkLocation").setVisible(true);
			var DateRange = oEvent.getParameter("value");
			this.getView().getModel("oModel").setProperty("/workdateRange", DateRange);
			this.getView().getModel("SummaryModel").setProperty("/Estimatedenddate", DateRange);
		},

		StartDateChange: function (oEvent) {
			if (oEvent.getSource().getDateValue() !== null) {
				var StartDate = new Date(oEvent.getSource().getDateValue());
				var endDate = this.getView().byId("idEstimatedEnddate").getDateValue();
				if (endDate && Object.prototype.toString.call(endDate) === '[object Date]' && Object.prototype.toString.call(StartDate) ===
					'[object Date]') {
					this._getCalculatedDays(StartDate, endDate);
				}
				this.getView().getModel("oModel").setProperty("/StartDate", StartDate);
				this.getView().getModel("oModel").refresh(true);
				this.getView().getModel("SummaryModel").setProperty("/workstartandtime", StartDate);

				// Check warning, if actual start date/time entered is less than current system date/time minus 2 hours(only create fault Permit Not for Edit/Alteration)
				this.getView().getModel("oModel").setProperty("/FaultWorkStartTimeFlag", false);
				if (this.permitMode === "create") {
					var currentDate = new Date();
					if (StartDate.getHours() <= (currentDate.getHours() - 2) && (StartDate.getMinutes() <= currentDate.getMinutes())) {
						this.getView().getModel("oModel").setProperty("/FaultWorkStartTimeFlag", true);
					}
				}
			}

			if (oEvent.getParameter("value").length !== 0) {
				oEvent.getSource().setValueState("None");
				this.removeNotification("StartDate");
			} else {
				oEvent.getSource().setValueState("Error");
			}
		},
		endDateChange: function (oEvent) {
			this.getView().byId("WorkLocation").setVisible(true);
			if (oEvent.getSource().getDateValue() !== null) {
				var endDate = new Date(oEvent.getSource().getDateValue());
				var date = new Date(endDate.getTime());
				var startDate = this.getView().byId("DTP1").getDateValue();
				if (startDate && Object.prototype.toString.call(startDate) === '[object Date]' && Object.prototype.toString.call(endDate) ===
					'[object Date]') {
					this._getCalculatedDays(startDate, endDate);
				}
				var jointingDate;
				var diffDate = endDate.getDate() - startDate.getDate();
				if (diffDate <= 2) {
					jointingDate = startDate;
				} else {
					jointingDate = new Date(date.setDate(date.getDate() - 2));
				}
				this.getView().getModel("oModel").setProperty("/jointingStartDate", jointingDate.toISOString());
				this.getView().getModel("oModel").setProperty("/jointingEndDate", jointingDate.toISOString());
				this.getView().getModel("oModel").setProperty("/EndDate", endDate.toISOString());
			}

			if (oEvent.getParameter("value").length !== 0) {
				oEvent.getSource().setValueState("None");
				this.removeNotification("endDate");
			} else {
				oEvent.getSource().setValueState("Error");
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		OnSearchLocation: function () {
			this.OnSearchMap();
			this.getView().byId("SelectedLocationDetails").setVisible(true);
		},

		onSubmitPermit: function (oEvent) {
			if (this.Alterchange) {
				if (!this.CheckIncident) {
					this.CheckIncident = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.CheckIncident", this);
					this.getView().addDependent(this.CheckIncident);
				}
				this.CheckIncident.open();
			} else {
				MessageBox.warning(this.getView().getModel("i18n").getResourceBundle().getText("alterchangeMsg"));
			}

		},

		onConfirmPermitSubmission: function (oEvent) {
			var oldIncidentNum = this.getView().getModel("oModel").getProperty("/IncidentProjectNumber").trim();
			var newIncidentNum = sap.ui.getCore().byId("idIncidentNumber").getValue().trim();

			if (oldIncidentNum === newIncidentNum) {
				this.onSubmission();
				this.CheckIncident.close();
				this.CheckIncident.destroy();
				this.CheckIncident = null;
			} else {
				if (newIncidentNum.length === 0) {
					sap.ui.getCore().byId("idIncidentNumber").setValueState("Error");
					sap.m.MessageToast.show("Please enter an incident number before confirm permit submission!!");
				} else {
					var sErrorText = this.onIncidentNumberValidation("idIncidentNumber");
					if (sErrorText !== null) {
						sap.m.MessageToast.show(sErrorText);
					} else {
						if (!this.CompareIncident) {
							this.CompareIncident = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.CompareIncident", this);
							this.getView().addDependent(this.CompareIncident);
						}

						var InsData = [{
							Incident: oldIncidentNum
						}, {
							Incident: newIncidentNum
						}];
						this.getView().getModel("oModel").setProperty("/DiffIncidentNumbers", InsData);
						this.getView().getModel("oModel").refresh(true);
						this.CheckIncident.close();
						this.CheckIncident.destroy();
						this.CheckIncident = null;
						this.CompareIncident.open();
						sap.ui.getCore().byId("idConfirmSubmit").setEnabled(false);
						sap.ui.getCore().byId("idIncidentSegbtn").setSelectedItem("none");
					}
				}
			}
		},

		handleChangeSbmitIncidentNumber: function (evt) {
			if (evt.getSource().getValue().length !== 0) {
				sap.ui.getCore().byId("idIncidentNumber").setValueState("None");
			} else {
				sap.ui.getCore().byId("idIncidentNumber").setValueState("Error");
			}
		},

		onSelectionChangeSegbutton: function () {
			sap.ui.getCore().byId("idConfirmSubmit").setEnabled(true);
		},

		onConfirmPermitSubmissionFinal: function () {
			this.getOwnerComponent().getModel("oModel").setProperty("/IncidentProjectNumber", sap.ui.getCore().byId("idIncidentSegbtn").getSelectedKey().trim());

			//RECALCULATE WORK NUMBER
			var oData = this.getModel("oModel").getData();
			var sWorkNo = "U";
			sWorkNo += oData.selectedDNO.substring(0, 1);
			var sIncidentNumber = sap.ui.getCore().byId("idIncidentSegbtn").getSelectedKey().trim().split("-")[1];
			while (sIncidentNumber.length < 9) {
				sIncidentNumber = "0" + sIncidentNumber;
			}
			sWorkNo += sIncidentNumber;
			sWorkNo += sap.ui.getCore().byId("idIncidentSegbtn").getSelectedKey().trim().split("-")[2];
			this.getModel("oModel").setProperty("/workno", sWorkNo);

			this.onSavePress("evt", true);
			this.CompareIncident.close();
			this.CompareIncident.destroy();
			this.CompareIncident = null;
		},

		onIncidentNumber: function () {
			if (!this.CheckIncident) {
				this.CheckIncident = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.CheckIncident", this);
				this.getView().addDependent(this.CheckIncident);
			}
			this.CheckIncident.open();
			sap.ui.getCore().byId("idIncidentNumber").setValue("");
			this.CompareIncident.close();
			this.CompareIncident.destroy();
			this.CompareIncident = null;
		},

		onPressCheckIncidentCancel: function () {
			sap.ui.getCore().byId("idIncidentNumber").setValue("");
			this.CheckIncident.close();
			this.CheckIncident.destroy();
			this.CheckIncident = null;
		},

		onPressCompareIncidentCancel: function () {
			sap.ui.getCore().byId("idIncidentNumber").setValue("");
			sap.ui.getCore().byId("idIncidentSegbtn").setSelectedItem("none");
			// sap.ui.getCore().byId("idIncidentSegbtn").setSelectedKey("");
			this.CompareIncident.close();
			this.CompareIncident.destroy();
			this.CompareIncident = null;
		},

		handleConfirmationMessageBoxPress: function (oEvent) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.confirm(
				"Do you want to cancel the application? If cancelled all unsaved data lost.", {
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				}
			);
		},

		ExportPopOver: null,
		onExport: function (oEvent) {
			if (!this.ExportPopOver) {
				this.ExportPopOver = sap.ui.xmlfragment("FaultsPermitapplication.FaultsPermitapplication.view.Fragment.Export", this);
				this.getView().addDependent(this.ExportPopOver);
			}
			this.ExportPopOver.openBy(oEvent.getSource());
		},

		// onExportPDF: function (oEvent) {
		// 	var pdf = new jsPDF();
		// 	pdf.addHTML($("#name").get(0), function () {
		// 		pdf.save("form.pdf");
		// 	});
		// },

		// onPrint: function () {
		// 	// window.print();
		// 	var oTarget = this.byId("FormDisplay480_Trial"); // getting the id of control to be print
		// 	var $domTarget = oTarget.$()[0], //getting the div of the body
		// 		sTargetContent = $domTarget.innerHTML,
		// 		sOriginalContent = document.body.innerHTML;

		// 	document.body.innerHTML = sTargetContent;
		// 	window.print();
		// 	document.body.innerHTML = sOriginalContent;
		// },

		onSelectTrafficmgmtype: function (evt) {
			if (evt.getParameter("selectedItem") !== null) {
				var result = evt.getParameter("selectedItem");
				this.getView().getModel("oModel").setProperty("/trafficType", result.getText());
				this.getView().getModel("oModel").setProperty("/trafficTypeKey", result.getKey().toLowerCase());
				this.removeNotification("TrafficManagementType");
				evt.getSource().setValueState("None");
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		getPermitconditions: function () {
			var oPromise = ApiFacade.getInstance().getPermitconditions();
			oPromise.then(function (oData) {
				for (var i in oData) {
					oData[i].visible = false;
				}
				this.getView().getModel("oModel").setProperty("/permitConditions", oData);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},

		getActivity: function () {
			var oPromise = ApiFacade.getInstance().getActivity();
			oPromise.then(function (oData) {
				this.getView().getModel("oModel").setProperty("/activities", oData);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},

		onSelectchkbox: function (evt) {
			var path = evt.getParameter("listItem").getBindingContextPath();
			var desc = JSON.parse(JSON.stringify(evt.getParameter("listItem").getBindingContext("oModel").getObject().description));
			if (desc.indexOf("-") !== -1) {
				desc = desc.split("-")[1];
			}
			if(!this.getView().getModel("oModel").getProperty(path + "/comment") ||
			this.getView().getModel("oModel").getProperty(path + "/comment") == ""){
				this.getView().getModel("oModel").setProperty(path + "/comment", desc);
			}
			if (evt.getParameter("selected")) {
				this.getView().getModel("oModel").setProperty(path + "/visible", true);
				evt.getParameter("listItem").getContent()[0].getItems()[1].setEnabled(true);
			} else {
				this.getView().getModel("oModel").setProperty(path + "/visible", false);
				this.removeNotification(this.getOwnerComponent().getModel("oModel").getProperty(path).code);
				evt.getParameter("listItem").getContent()[0].getItems()[1].setValueState("None");
			}
			this.getView().getModel("oModel").updateBindings();
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		onChangeCondition: function(oEvent){
			var sValue = oEvent.getSource().getValue();
			if(!sValue || sValue.trim() === ""){
				oEvent.getSource().setValueState("Error");
			}else{
				oEvent.getSource().setValueState("None");
			}
		},

		onChangePermitInput: function (evt) {
			if (evt.getParameter("value").length !== 0) {
				evt.getSource().setValueState("None");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
		},

		onSelectDNO: function (oEvent) {
			this.validSegmentedButton(this.getView().byId("idSegDno"), "removeStyleClass");
			this.removeNotification("DNO");
			var resultArray = this.getView().getModel("oModel").getProperty("/allData");
			// var newArray = resultArray.filter(value => value.dno === oEvent.getParameter("selectedItem").getText());
			var newArray = resultArray.filter(function (param) {
				return param.dno === oEvent.getParameter("item").getText();
			});
			this.getView().getModel("oModel").setProperty("/operational", newArray);
			var selText = oEvent.getParameter("item").getText();
			this.getView().getModel("oModel").setProperty("/selectedDNO", selText);
			var items = this.getView().byId("idPermitPrimaryComBox").getItems();

			for (var i in items) {
				if (items[i].getText().indexOf(selText) !== -1) {
					this.getView().byId("idPermitPrimaryComBox").setSelectedItem(items[i]);
				}
			}
			var oData = this.getModel("oModel").getData();
			if (oData.IncidentProjectNumber && oData.IncidentProjectNumber !== "" 
			&& oData.IncidentProjectNumber.split("-").length > 2) {
				var sWorkNo = "U";
				sWorkNo += selText.substring(0, 1);
				var sIncidentNumber = oData.IncidentProjectNumber.trim().split("-")[1];
				while (sIncidentNumber.length < 9) {
					sIncidentNumber = "0" + sIncidentNumber;
				}
				sWorkNo += sIncidentNumber;
				sWorkNo += oData.IncidentProjectNumber.trim().split("-")[2];
				this.getModel("oModel").setProperty("/workno", sWorkNo);
			}
		},

		onchangeCollaborative: function (evt) {
			if (evt.getSource().getSelectedKey() === "yes") {
				this.getView().byId("CollabDetLabel").setVisible(true);
				this.getView().byId("CollabDetText").setVisible(true);
				this.getView().byId("CollabWorkLabel").setVisible(true);
				this.getView().byId("CollabWorkText").setVisible(true);
				this.getView().byId("CollabTypeLabel").setVisible(true);
				this.getView().byId("CollabTypeBox").setVisible(true);
				this.getView().getModel("oModel").setProperty("/collaborativeWorking", true);
			} else {
				this.getView().byId("CollabDetLabel").setVisible(false);
				this.getView().byId("CollabDetText").setVisible(false);
				this.getView().byId("CollabWorkLabel").setVisible(false);
				this.getView().byId("CollabWorkText").setVisible(false);
				this.getView().byId("CollabTypeLabel").setVisible(false);
				this.getView().byId("CollabTypeBox").setVisible(false);
				this.getView().getModel("oModel").setProperty("/collaborativeWorking", false);
				this.removeNotification("CollaborationDetails");
				this.removeNotification("Collaborationtype");
				this.getView().byId("CollabDetText").setValueState("None");
				this.getView().byId("CollabTypeBox").setValueState("None");
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		onWRP: function (oEvent) {
			this.validSegmentedButton(this.getView().byId("idFaultWRP"), "removeStyleClass");
			this.removeNotification("Wrp");
			if (oEvent.getSource().getSelectedKey() === "yes") {
				this.getView().byId("idWrpLbl").setVisible(true);
				this.getView().byId("idWrpBox").setVisible(true);
				this.getView().getModel("oModel").setProperty("/wrp", true);
				this.getWRPAuthority();
			} else {
				this.getView().byId("idWrpLbl").setVisible(false);
				this.getView().byId("idWrpBox").setVisible(false);
				this.getView().getModel("oModel").setProperty("/wrp", false);
			}
			// var result = oEvent.getParameter("item").getText();
			// this.getView().getModel("oModel").setProperty("/WrpAuthority", result);
		},

		onEnvironmentFlag: function (oEvent) {
			if (oEvent.getSource().getSelectedKey() === "yes") {
				this.getView().byId("idEnvHealthLbl").setVisible(true);
				this.getView().byId("idEnvHealthInput").setVisible(true);
			} else {
				this.getView().byId("idEnvHealthLbl").setVisible(false);
				this.getView().byId("idEnvHealthInput").setVisible(false);
				this.getView().byId("idEnvHealthInput").setValue("");
			}
			var result = oEvent.getParameter("item").getText() === "Yes" ? true : false;
			this.getOwnerComponent().getModel("oModel").setProperty("/environmentFlag", result);
			this.removeNotification("AreEnvironmentalHealthNotifiable");
			this.validSegmentedButton(this.getView().byId("idFaultEnvironmentalSegBtn"), "removeStyleClass");
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		moreInfoPoppver: null,
		handleMoreInformation: function (oEvent) {
			var path = oEvent.getSource().getBindingContext("oModel").getPath();
			this.getView().getModel("oModel").setProperty("/specialDesigDescription", this.getView().getModel("oModel").getProperty(path).special_desig_location_text);
			if (!this.moreInfoPoppver) {
				this.moreInfoPoppver = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.MoreInformation", this);
				this.getView().addDependent(this.moreInfoPoppver);
			}
			this.moreInfoPoppver.openBy(oEvent.getSource());
		},
		onSelectOtherContractor: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/otherContractorId", selItem);
			} else {
				this.getOwnerComponent().getModel("oModel").setProperty("/otherContractorId", null);
			}
		},

		onAddOtherContractor: function () {
			this.getView().byId("idOtherContractorLbl").setVisible(true);
			this.getView().byId("idOtherContractorBox").setVisible(true);
			this.getView().byId("idOtherContractorBtn").setVisible(true);
			this.getView().byId("idAddAnotherBtn").setVisible(false);
		},

		onDeleteContractor: function () {
			this.getView().byId("idOtherContractorLbl").setVisible(false);
			this.getView().byId("idOtherContractorBox").setVisible(false);
			this.getView().byId("idOtherContractorBtn").setVisible(false);
			this.getView().byId("idAddAnotherBtn").setVisible(true);
			this.getView().getModel("oModel").refresh(true);
			this.getView().byId("idOtherContractorBox").clearSelection();
			this.getOwnerComponent().getModel("oModel").setProperty("/otherContractorId", null);
			this.getView().getModel("SummaryModel").setProperty("/Othercontractor", "");
		},

		createSummaryModel: function () {
			var data = {
				UKPNWorksReferenceNo: "",
				SAPWorkOrderNo: "",
				SAPWorkOrderOperationsNo: "",
				Primarycontractor: "",
				Secondarycontractor: "N/A",
				Othercontractor: "N/A",
				WorkType: "",
				Workdaterange: "",
				Jointingdate: "",
				Trafficmanagementtype: "",
				FootwayClosure: "N/A",
				Excavationrequired: "",
				Collaborationtype: "",
				Streetcategory: "",
				WRP: "",
				WRPauthority: "",
				Departmentidentifier: "",
				Worksdescription: "",
				Personresponsible: "",
				PermitConditions: [],
				workstartandtime: new Date(),
				Estimatedenddate: "",
				IncidentProjectNo: "",
				WorksIdentifier: "",
				selectedLocation: "",
				USRN: "",
				RoadCategories: "",
				LocationDetails: "",
				Operationalzone: "",
				DNO: "",
				HighwayAuthority: "",
				Specialdesignations: [],
				PositionofWorks: [],
				WorkTypevisible: false,
				Permitcondvisible: true,
				PermitConditionsLength: 0,
				Specialdesignationvisible: true,
				SpecialdesignationLength: 0,
				Requestor: "",
				CommentstoHighwayAuthority: [],
				designations: [],
				PrintMode: false
			};
			var oModel = new JSONModel(data);
			this.getView().setModel(oModel, "SummaryModel");
		},

		onSavePressButton: function(evt, bSubmit){
			if(this.byId("RefNo").getValueState() !== "Error" && (this.permitMode !== "AlterPermit" || !this.bGeometryChanged || (this.bGeometryChanged && this.bLocDescChanged))){
				this.onSavePress("evt", false);
			}else{
				var sMessage = "";
				if(this.byId("RefNo").getValueState() === "Error"){
					sMessage = this.byId("RefNo").getValueStateText();
				}
				if(this.permitMode === "AlterPermit" && (this.bGeometryChanged && !this.bLocDescChanged)){
					if(sMessage === ""){
						sMessage = this.getResourceBundle().getText("alterLocationError");
					}else{
						sMessage += "\n" + this.getResourceBundle().getText("alterLocationError");
					}
				}
				MessageBox.warning(sMessage);
			}
		},

		onSaveContinueButton: function (evt) {
			var valid = this._onValidateFields();
			if (!valid) {
				this.getOwnerComponent().getModel("oModel").refresh(true);
				this._openmessagePopOver();
			} else {
				var oPage = this.getView().byId("navCon").getCurrentPage().getNavButtonTooltip();
				if(this.permitMode !== "AlterPermit" || !this.bGeometryChanged || (this.bGeometryChanged && this.bLocDescChanged)){
					this.onSavePress("evt", false);
					if (oPage === "LocationDetails") {
						this.setLocationDetails();
						this.getView().byId("idFaultp2").scrollTo(10, 100);
						this.getView().byId("navCon").to(this.byId("idFaultp2"));
						this.getView().byId("idFaultBackBtn").setVisible(true);
						this.getView().byId("idFaultStep2").addStyleClass("clickBorder");
						this.getView().byId("idFaultStep1").removeStyleClass("clickBorder");
					} else if (oPage === "WorkDetails") {
						this.setWorkDetails();
						this.getView().byId("navCon").to(this.byId("idFaultp3"));
						this.getView().byId("idFaultBackBtn").setVisible(true);
						this.getView().byId("idFaultsaveAndContinue").setVisible(false);
						this.getView().byId("idFaultsubmitPermit").setVisible(true);
						this.getView().byId("idFaultStep3").addStyleClass("clickBorder");
						this.getView().byId("idFaultStep2").removeStyleClass("clickBorder");
						if (this.permitMode === "InternalEdit") {
							this.getView().byId("idFaultsubmitPermit").setVisible(false);
							this.getView().byId("idBtnSave").setVisible(false);
							this.getView().byId("idFaultCancelBtn").setVisible(false);
							this.getView().byId("idFaultCloseBtn").setVisible(true);
						}
					}
					if (this.permitMode !== "AlterPermit") {
						this.Alterchange = true;
					}
				}else{
					MessageBox.warning(this.getResourceBundle().getText("alterLocationError"));
				}
			}
		},

		onIncidentNumberValidation: function (sId) {
			var oInput = this.getView().byId(sId) ? this.getView().byId(sId) : sap.ui.getCore().byId(sId);
			var incidentNumber = oInput.getValue().trim();
			// var regEx = /^INCD\-\d{8}\-\w$/;
			// var regEx = /INCD\-\d[0-9]{0,8}\-\w$/;
			var regEx = /^INCD\-\d{1,8}\-\w$/;
			if (incidentNumber !== null && incidentNumber !== "") {
				if (!regEx.test(incidentNumber)) {
					oInput.setValueState("Error");
					// oInput.setValueStateText(
					// 	"Please enter the Incident Number in the correct format. Example: INCD-34524-H (max 15 characters)");
					oInput.setValueStateText(this.getView().getModel("i18n").getResourceBundle().getText("Incident_number_error"));
					return (this.getView().getModel("i18n").getResourceBundle().getText("Incident_number_error"));
				} else {
					this.getView().getModel("oModel").setProperty("/IncidentProjectNumber", incidentNumber);
					return null;
				}
			} else {
				return "Incident/project number is a required field";
			}
		},

		setLocationDetails: function () {
			var model = this.getView().getModel("SummaryModel");
			var mainModel = this.getOwnerComponent().getModel("oModel");
			model.setProperty("/UKPNWorksReferenceNo", mainModel.getProperty("/UKPNWorksReferenceNumber"));
			model.setProperty("/SAPWorkOrderNo", mainModel.getProperty("/workno"));
			model.setProperty("/SAPWorkOrderOperationsNo", mainModel.getProperty("/workoperationno"));
			model.setProperty("/IncidentProjectNo", mainModel.getProperty("/IncidentProjectNumber"));
			model.setProperty("/RoadCategories", mainModel.getProperty("/roadCategory"));
			model.setProperty("/USRN", mainModel.getProperty("/USRN"));
			// model.setProperty("/selectedLocation", mainModel.getProperty("/selectedLocation"));
			model.setProperty("/WorkType", "IMMEDIATE");

			//Begin - Exact location with selected location for summary - CR MVP2 - UKPN-2786
			var isSelectedLocation = mainModel.getProperty("/LocationDescription") + "," + mainModel.getProperty("/selectedLocation");
			model.setProperty("/selectedLocation", isSelectedLocation);
			//End - Exact location with selected location for summary - CR MVP2 - UKPN-2786

			if (this.getView().byId("idOperationalZone").getSelectedItem() !== null) {
				model.setProperty("/Operationalzone", this.getView().byId("idOperationalZone").getSelectedItem().getText());
			}
			if (this.getView().byId("idHighwayAuthBox").getSelectedItem() !== null) {
				model.setProperty("/HighwayAuthority", this.getView().byId("idHighwayAuthBox").getSelectedItem().getText());
			}
			if (this.getView().byId("idWorkIdentifier").getSelectedItem() !== null) {
				model.setProperty("/WorksIdentifier", this.getView().byId("idWorkIdentifier").getSelectedItem().getText());
			}

			var selItems = this.getView().byId("idFaultMultiPositionofworks").getSelectedItems(),
				selPosworks = [];
			if (selItems.length !== 0) {
				for (var i in selItems) {
					selPosworks.push({
						text: selItems[i].getText()
					});
				}
			}
			model.setProperty("/PositionofWorks", selPosworks);
			model.refresh(true);
		},

		setWorkDetails: function () {
			var model = this.getView().getModel("SummaryModel");
			var mainModel = this.getOwnerComponent().getModel("oModel");

			var permitSelPath = this.getView().byId("idFaultPermitList").getSelectedContextPaths();
			var permitCond = [];
			for (var i in permitSelPath) {
				permitCond.push({
					permit: mainModel.getProperty("/conditions")[i].condition + "-" + mainModel.getProperty("/conditions")[i].comment
				});
			}
			var flags = {};
			var uniquepermitCond = permitCond.filter(function (entry) {
				if (flags[entry.permit.split("-")[0]]) {
					return false;
				}
				flags[entry.permit.split("-")[0]] = true;
				return true;
			});
			this.getView().getModel("SummaryModel").setProperty("/PermitConditions", uniquepermitCond);
			this.getView().getModel("SummaryModel").setProperty("/PermitConditionsLength", uniquepermitCond.length);

			if (this.getView().byId("idPermitPrimaryComBox").getSelectedItem() !== null) {
				this.getView().getModel("SummaryModel").setProperty("/Primarycontractor", this.getView().byId("idPermitPrimaryComBox").getSelectedItem()
					.getText());
			} else {
				this.getView().getModel("SummaryModel").setProperty("/Primarycontractor", "");
			}
			if (this.getView().byId("idSecondaryContractor").getSelectedItem() !== null) {
				this.getView().getModel("SummaryModel").setProperty("/Secondarycontractor", this.getView().byId("idSecondaryContractor").getSelectedItem()
					.getText());
			} else {
				this.getView().getModel("SummaryModel").setProperty("/Secondarycontractor", "N/A");
			}

			if (this.getView().byId("idOtherContractorBox").getSelectedItem() !== null) {
				this.getView().getModel("SummaryModel").setProperty("/Othercontractor", this.getView().byId("idOtherContractorBox").getSelectedItem()
					.getText());
			} else {
				this.getView().getModel("SummaryModel").setProperty("/Othercontractor", "");
			}

			if (this.getView().byId("idTrafficmgmttype").getSelectedItem() !== null) {
				this.getView().getModel("SummaryModel").setProperty("/Trafficmanagementtype", this.getView().byId("idTrafficmgmttype").getSelectedItem()
					.getText());
			} else {
				this.getView().getModel("SummaryModel").setProperty("/Trafficmanagementtype", "");
			}

			if (this.getView().byId("idFootwayClosure").getSelectedItem() !== null) {
				this.getView().getModel("SummaryModel").setProperty("/FootwayClosure", this.getView().byId("idFootwayClosure").getSelectedItem()
					.getText());
			} else {
				this.getView().getModel("SummaryModel").setProperty("/FootwayClosure", "");
			}
			model.setProperty("/Excavationrequired", this.getView().byId("idSegmntBtnExcavation").getSelectedKey());
			// model.setProperty("/Excavationrequired", this.getView().byId("idSegmntBtnExcavation").getSelectedKey());
			if (this.getView().byId("idCollaborativeWorking").getSelectedKey() === "yes") {
				if (this.getView().byId("CollabTypeBox").getSelectedItem() !== null) {
					this.getView().getModel("SummaryModel").setProperty("/Collaborationtype", this.getView().byId("CollabTypeBox").getSelectedItem()
						.getText());
				} else {
					this.getView().getModel("SummaryModel").setProperty("/Collaborationtype", "");
				}
			}

			model.setProperty("/Worksdescription", mainModel.getProperty("/Worksdescription"));
			model.setProperty("/Personresponsible", mainModel.getProperty("/PersonResponsible"));
			model.setProperty("/Requestor", mainModel.getProperty("/Requestor"));
		},

		onBackNav: function (evt) {
			this.onSavePress("evt", false);
			var oPage = this.getView().byId("navCon").getCurrentPage().getNavButtonTooltip();
			if (oPage === "WorkDetails") {
				this.getView().byId("idFaultp1").scrollTo(10, 100);
				this.getView().byId("navCon").to(this.byId("idFaultp1"));
				this.getView().byId("idFaultBackBtn").setVisible(false);
				this.getView().byId("idFaultStep1").addStyleClass("clickBorder");
				this.getView().byId("idFaultStep2").removeStyleClass("clickBorder");
			} else if (oPage === "Summary") {
				this.getView().byId("idFaultp2").scrollTo(10, 100);
				this.getView().byId("navCon").to(this.byId("idFaultp2"));
				this.getView().byId("idFaultBackBtn").setVisible(true);
				this.getView().byId("idFaultsaveAndContinue").setVisible(true);
				this.getView().byId("idFaultsubmitPermit").setVisible(false);
				this.getView().byId("idFaultStep2").addStyleClass("clickBorder");
				this.getView().byId("idFaultStep3").removeStyleClass("clickBorder");
				if (this.permitMode === "InternalEdit") {
					this.getView().byId("idBtnSave").setVisible(true);
					this.getView().byId("idFaultCancelBtn").setVisible(true);
					this.getView().byId("idFaultCloseBtn").setVisible(false);
				}
			}
		},

		onPressEditWorkDetails: function () {
			this.getView().byId("idFaultp2").scrollTo(10, 100);
			this.getView().byId("idFaultsaveAndContinue").setVisible(true);
			this.getView().byId("idFaultsubmitPermit").setVisible(false);
			this.getView().byId("idFaultStep2").addStyleClass("clickBorder");
			this.getView().byId("idFaultStep3").removeStyleClass("clickBorder");
			this.getView().byId("navCon").to(this.byId("idFaultp2"));
		},

		onPressEditWorkLocationDetails: function () {
			this.getView().byId("idFaultp1").scrollTo(1, 100);
			this.getView().byId("idFaultBackBtn").setVisible(false);
			this.getView().byId("idFaultsaveAndContinue").setVisible(true);
			this.getView().byId("idFaultsubmitPermit").setVisible(false);
			this.getView().byId("idFaultStep1").addStyleClass("clickBorder");
			this.getView().byId("idFaultStep3").removeStyleClass("clickBorder");
			this.getView().byId("navCon").to(this.byId("idFaultp1"));
		},

		onPressSummaryWorktype: function (evt) {
			if (evt.getSource().getText() === "View Details") {
				this.getView().getModel("SummaryModel").setProperty("/WorkTypevisible", true);
				evt.getSource().setText("Hide Details");
			} else {
				this.getView().getModel("SummaryModel").setProperty("/WorkTypevisible", false);
				evt.getSource().setText("View Details");
			}
		},

		onPressLinkPermitSummary: function (evt) {
			if (evt.getSource().getText() === "View all") {
				this.getView().getModel("SummaryModel").setProperty("/Permitcondvisible", true);
				evt.getSource().setText("Hide All");
			} else {
				this.getView().getModel("SummaryModel").setProperty("/Permitcondvisible", false);
				evt.getSource().setText("View all");
			}
		},

		onPressLinkSplDesignationSummary: function (evt) {
			if (evt.getSource().getText() === "View all") {
				this.getView().getModel("SummaryModel").setProperty("/Specialdesignationvisible", true);
				evt.getSource().setText("Hide All");
			} else {
				this.getView().getModel("SummaryModel").setProperty("/Specialdesignationvisible", false);
				evt.getSource().setText("View all");
			}
		},

		onSelectAllDesignation: function (oEvent) {
			var sKey = oEvent.getParameter("item").getKey();
			var sIndex = sKey === "yes" ? 0 : 1;
			var list = this.getView().byId("idDesignationList").getItems();
			list.forEach(function (item, index, object) {
				item.getCells()[item.getCells().length - 1].setSelectedKey(sKey);
				item.getCells()[item.getCells().length - 1].setSelectedKey({
					item: item.getCells()[item.getCells().length - 1]
				});
				item.getCells()[item.getCells().length - 1].fireSelectionChange({
					item: item.getCells()[item.getCells().length - 1].getItems()[sIndex]
				});
			}.bind(this));
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		onSelectDesignation: function (evt) {
			this.Specialdesignations = true;
			var itemPath = evt.getParameter("item").getParent().getParent().getBindingContextPath();
			var model = this.getOwnerComponent().getModel("oModel");
			var list = this.getView().byId("idDesignationList").getItems();
			list.forEach(function (item, index, object) {
				list[index].setHighlight("None");
			});
			this.removeNotification("Specialdesignations");
			this.byId("specailDesignation").setVisible(false);
			if (evt.getParameter("item").getText() === "Yes") {
				model.getData().selectedSplDesignations.push(model.getProperty(itemPath));
				this.getView().getModel("SummaryModel").getData().Specialdesignations.push({
					designation: model.getProperty(itemPath + "/special_desig_description")
				});
				this.getView().getModel("SummaryModel").setProperty("/SpecialdesignationLength", this.getView().getModel("SummaryModel").getProperty(
					"/Specialdesignations").length);
			} else {
				model.getData().selectedSplDesignations.forEach(function (item, index, object) {
					if (model.getProperty(itemPath).special_desig_description === item.special_desig_description) {
						object.splice(index, 1);
					}
				});
				this.getView().getModel("SummaryModel").getData().Specialdesignations.forEach(function (item, index, object) {
					if (model.getProperty(itemPath).special_desig_description === item.designation) {
						object.splice(index, 1);
					}
				});
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		getWRPAuthority: function () {
			BusyIndicator.show(0);
			var oCreatePromise = ApiFacade.getInstance().getWRPflag();
			oCreatePromise.then(function (data) {
					BusyIndicator.hide();
					this.getView().getModel("oModel").setProperty("/WrpAuthority", data);
					this.getView().getModel("oModel").refresh(true);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		onFootwayClosure: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var result = oEvent.getParameter("selectedItem");
				this.getView().getModel("oModel").setProperty("/footwayClosure", result.getText());
				this.getView().getModel("oModel").setProperty("/footwayClosureKey", result.getKey().toLowerCase());
				this.removeNotification("FootwayClosure");
				oEvent.getSource().setValueState("None");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
		},

		onSaveComments: function () {
			var isApplicationId = this.getOwnerComponent().getModel("oModel").getProperty("/isApplicationId");
			var isCommentId = this.getOwnerComponent().getModel("oModel").getProperty("/isCommentId");
			var CommentPayload = {
				content: this.getView().getModel("oModel").getProperty("/CommentstoHighwayAuthority").trim(),
				type: "EXTERNAL"
			};
			var CSRFToken = this.getOwnerComponent().CSRFToken;
			if (!isCommentId) {
				$.ajax({
					type: "POST",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + isApplicationId.applicationId + "/comments",
					contentType: "application/json",
					async: false,
					data: JSON.stringify(CommentPayload),
					headers: {
						"x-csrf-token": CSRFToken
					},
					success: function (data) {
						this.getView().getModel("oModel").setProperty("/isCommentId", data.commentId);
						this.getView().getModel("SummaryModel").getData().CommentstoHighwayAuthority.push({
							commentText: this.getView().getModel("oModel").getProperty("/CommentstoHighwayAuthority").trim(),
							commentType: "EXTERNAL",
							commentId: data.commentId
						});
						this.getView().getModel("SummaryModel").refresh(true);
						this.getView().getModel("oModel").refresh(true);
					}.bind(this),
					error: function (err) {

					}.bind(this)
				});
			} else {
				$.ajax({
					type: "PUT",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + isApplicationId.applicationId + "/comments/" + isCommentId,
					contentType: "application/json",
					async: false,
					data: JSON.stringify(CommentPayload),
					headers: {
						"x-csrf-token": CSRFToken
					},
					success: function (data) {
						var model = this.getView().getModel("SummaryModel");
						model.getData().CommentstoHighwayAuthority.forEach(function (item) {
							if (item.commentId === this.getView().getModel("oModel").getProperty("/isCommentId")) {
								item.commentText = this.getView().getModel("oModel").getProperty("/CommentstoHighwayAuthority").trim();
							}
						}.bind(this));
						model.refresh(true);
					}.bind(this),
					error: function (err) {

					}.bind(this)
				});
			}
		},

		onSavePress: function (evt, bSubmit) {
			var oPage = this.getView().byId("navCon").getCurrentPage().getNavButtonTooltip();
			var isApplicationId = this.getOwnerComponent().getModel("oModel").getProperty("/isApplicationId");
			this.getCondition();
			this.onHighwayAuthority();
			this.getOwnerComponent().getModel("oModel").setProperty("/primaryContractorId", this.getView().byId("idPermitPrimaryComBox").getSelectedKey());
			var mainModel = this.getView().getModel("oModel").getProperty("/");
			mainModel.jointingFlag = true;
			var startDate = mainModel.StartDate;
			var endDate = mainModel.EndDate;
			if (startDate === undefined) {
				startDate = "";
			} else {
				startDate = mainModel.StartDate;
			}
			if (endDate === undefined) {
				endDate = "";
			} else {
				endDate = mainModel.EndDate;
			}

			var flags = {};
			var uniquepermitCond = mainModel.conditions.filter(function (entry) {
				if (flags[entry.condition]) {
					return false;
				}
				flags[entry.condition] = true;
				return true;
			});
			if (mainModel.workIdentifierId) {
				if (Number(mainModel.workIdentifierId) === 138) {
					mainModel.wrp = true;
					mainModel.WRPauthorityDisplay = this.getView().byId("idHighwayAuthBox").getSelectedItem().getText().split(" - ")[0];
				} else {
					mainModel.wrp = false;
					mainModel.WRPauthorityDisplay = "";
				}
			}

			if (this.getView().byId("idWorkIdentifier").getSelectedItem()) {
				this.getView().getModel("oModel").setProperty("/departmentIdentifierId", this.getView().byId("idWorkIdentifier").getSelectedItem()
					.getBindingContext("oModel").getObject().departmentId);
			} else {
				this.getView().getModel("oModel").setProperty("/departmentIdentifierId", null);
			}

			var payLoad = {
				workOrderNumber: mainModel.workno,
				workOrderOperationNumber: mainModel.workoperationno,
				activityType: mainModel.activityType,
				proposedStartDate: startDate,
				proposedEndDate: endDate,
				incidentReference: mainModel.IncidentProjectNumber,
				usrn: mainModel.usrn,
				roadCategory: mainModel.roadCategory,
				street: mainModel.street,
				area: mainModel.area,
				// town: mainModel.area,
				town: mainModel.town,
				locationDescription: mainModel.LocationDescription,
				dno: mainModel.selectedDNO,
				operationalZone: mainModel.selectedOperationZone,
				highwayAuthority: mainModel.highwayId,
				positionOfWorks: mainModel.positionOfWorks,
				privateLandFlag: mainModel.privateLandFlag,
				primaryContractorId: mainModel.primaryContractorId,
				secondaryContractorId: mainModel.ApplicationDetails.secondaryContractorId ? Number(mainModel.ApplicationDetails.secondaryContractorId) : null,
				jointingRequiredFlag: mainModel.jointingFlag,
				jointingStartDate: mainModel.jointingStartDate,
				jointingEndDate: mainModel.jointingEndDate,
				trafficManagementType: mainModel.trafficTypeKey,
				trafficManagementContractorId: mainModel.ApplicationDetails.trafficManagementContractorId,
				closeFootway: mainModel.footwayClosureKey,
				collaborationDetails: mainModel.collaborationDetails,
				collaborativeWorks: mainModel.Collaborationworksreference,
				collaborativeWorkingFlag: mainModel.collaborativeWorking,
				collaborationType: mainModel.collaborativeWorkingType,
				excavationFlag: mainModel.excavationRequired,
				wrpAuthority: mainModel.WRPauthorityDisplay,
				wrpFlag: mainModel.wrp,
				environmentalFlag: mainModel.environmentFlag,
				workType: "immediate",
				// ttroRequiredFlag: false,
				departmentIdentifier: mainModel.departmentIdentifierId,
				worksIdentifier: mainModel.workIdentifierId,
				workDescription: mainModel.Worksdescription,
				specialDesignations: mainModel.selectedSplDesignations,
				conditions: uniquepermitCond,
				earlyStartPreApprovalFlag: null,
				earlyStartReason: null,
				// immediateRiskFlag: false,
				// preApprovalDetails: false,
				// preApprovalAuthoriser: false,
				personResponsible: mainModel.PersonResponsible,
				busStopSuspensionFlag: mainModel.busStopSuspensionFlag,
				parkingSuspensionFlag: mainModel.parkingSuspensionFlag,
				agreementReferenceNumber: mainModel.AgreementReferenceNo,
				workCategory: mainModel.workCategory,
				otherContractorId: mainModel.otherContractorId,
				trafficSensitiveFlag : mainModel.trafficSensitive,
				personResponsiblePhone: mainModel.PersonresponsContactdetails,
				workReferenceNumber: this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber") ? this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber") : this.getModel("oModel").getProperty("/ApplicationDetails/workReferenceNumber"),
				isAnOldPermit: mainModel.isAnOldPermit ? mainModel.isAnOldPermit : mainModel.ETONedit,
				workingGroupId: mainModel.WorkingGroupId
			};
			if (mainModel.geometry) {
				payLoad.geometry = mainModel.geometry;
			} else {
				payLoad.geometry = {
					type: "Point",
					coordinates: [296203.0, 223864.0]
				};
			}
			BusyIndicator.show(0);
			var oPromise;
			if (!isApplicationId) {
				if (!this.AlterapplicationID) {
					if(!this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber") || this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber") === ""){
						payLoad.isAnOldPermit = false;
					}
					oPromise = ApiFacade.getInstance().createApplication(payLoad);
				} else {
					oPromise = ApiFacade.getInstance().createAlterPermit(this.AlterapplicationID, payLoad);
				}
				oPromise.then(function (data) {
						BusyIndicator.hide();
						sap.m.MessageToast.show("Records are saved successfully");
						this.getView().getModel("oModel").setProperty("/isApplicationId", data);
						this.alterationId = data.applicationId;
						this.byId("RefNo").setEnabled(false);
						this.byId("ETONedit").setVisible(true);
						this.byId("ETONcancel").setVisible(false);
						if(this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber")){
							this.getModel("oModel").setProperty("/ApplicationDetails/workReferenceNumber", 
							this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber"))
						}
					}.bind(this))
					.catch(function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this));
			} else {
				if (!this.AlterapplicationID) {
					oPromise = ApiFacade.getInstance().updateApplication(isApplicationId.applicationId, payLoad);
				} else {
					oPromise = ApiFacade.getInstance().updateAlterPermit(this.AlterapplicationID, payLoad, this.alterationId);
				}
				oPromise.then(function (data) {
						if (bSubmit) {
							this.onSubmission();
						} else {
							this.updateAttachments();
						}
						this.byId("RefNo").setEnabled(false);
						this.byId("ETONedit").setVisible(true);
						this.byId("ETONcancel").setVisible(false);
						if(this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber")){
							this.getModel("oModel").setProperty("/ApplicationDetails/workReferenceNumber", 
							this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber"))
						}
					}.bind(this))
					.catch(function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this));
				var comments = this.getOwnerComponent().getModel("oModel").getProperty("/CommentstoHighwayAuthority");
				if (comments !== undefined || comments !== null) {
					comments = comments === null ? "" : comments;
					comments = comments === undefined ? "" : comments;
					comments = comments.trim();
					if (oPage === "WorkDetails" && comments.length !== 0) {
						this.onSaveComments();
					}
				}
			}
		},

		updateAttachments: function () {
			var aItems = this.byId("uploadCollection").getItems();
			var aTrafficItems = this.byId("uploadCollectionTraffic").getItems();
			var aFormFiles = [];
			var aTrafficFormFiles = [];
			var aFinalFiles = [];
			var aFinalTrafficFiles = [];

			// Deletion
			if (this.aOldAttachments) {
				aFormFiles = this.aOldAttachments.reduce(function (acc, value) {
					var bDelete = true;
					aItems.forEach(function (oItem) {
						if (
							oItem.mProperties.ariaLabelForPicture &&
							oItem.mProperties.ariaLabelForPicture === value.mProperties.ariaLabelForPicture
						) {
							bDelete = false;
						}
					});

					if (bDelete) {
						acc.push({
							id: value.mProperties.ariaLabelForPicture,
							mode: "deletion"
						});
					} else {
						aFinalFiles.push(value);
					}
					return acc;
				}, aFormFiles);
			}

			// Traffic Deletion
			if (this.aOldTrafficAttachments) {
				aTrafficFormFiles = this.aOldTrafficAttachments.reduce(function (acc, value) {
					var bDelete = true;
					aTrafficItems.forEach(function (oItem) {
						if (
							oItem.mProperties.ariaLabelForPicture &&
							oItem.mProperties.ariaLabelForPicture === value.mProperties.ariaLabelForPicture
						) {
							bDelete = false;
						}
					});

					if (bDelete) {
						acc.push({
							id: value.mProperties.ariaLabelForPicture,
							mode: "deletion"
						});
					} else {
						aFinalTrafficFiles.push(value);
					}
					return acc;
				}, aTrafficFormFiles);
			}

			// Creation
			aFormFiles = aItems.reduce(
				function (acc, oItem) {
					if (!oItem.mProperties.ariaLabelForPicture) {
						acc.push(oItem);
					}
					return acc;
				}.bind(this),
				aFormFiles
			);

			// Traffic Creation
			aTrafficFormFiles = aTrafficItems.reduce(
				function (acc, oItem) {
					if (!oItem.mProperties.ariaLabelForPicture) {
						acc.push(oItem);
					}
					return acc;
				}.bind(this),
				aTrafficFormFiles
			);

			if (aFormFiles.length > 0 || aTrafficFormFiles.length > 0) {

				var sId = this.getModel("oModel").getProperty("/isApplicationId/applicationId");
				BusyIndicator.show(0);
				var aPromises = [];

				aFormFiles.forEach(function (oFormFile) {
					if (oFormFile.mode && oFormFile.mode === "deletion") {
						return ApiFacade.getInstance().deleteApplicationFile(
							oFormFile.id,
							sId
						);
					}
					var oCreatePromise = ApiFacade.getInstance().createApplicationFile(
						oFormFile,
						sId
					);
					oCreatePromise.then(function (oData) {
						aFinalFiles.push(oData);
					});
					aPromises.push(oCreatePromise);
				}.bind(this));

				aTrafficFormFiles.forEach(function (oFormFile) {
					if (oFormFile.mode && oFormFile.mode === "deletion") {
						return ApiFacade.getInstance().deleteApplicationFile(
							oFormFile.id,
							sId
						);
					}
					var oCreatePromise = ApiFacade.getInstance().createApplicationTrafficFile(
						oFormFile,
						sId
					);
					oCreatePromise.then(function (oData) {
						aFinalTrafficFiles.push(oData);
					});
					aPromises.push(oCreatePromise);
				}.bind(this));

				Promise.all(aPromises)
					.then(
						function (aResolve) {
							this.aOldAttachments = aFinalFiles;
							this.aOldTrafficAttachments = aFinalTrafficFiles;
							this.getModel("AttachmentsModel").setProperty("/attachments", aFinalFiles);
							this.getModel("AttachmentsTrafficModel").setProperty("/attachments", aFinalTrafficFiles);
							BusyIndicator.hide();
							sap.m.MessageToast.show("Records are saved successfully");
						}.bind(this)
					)
					.catch(
						function (oReject) {
							//Hide busy application
							BusyIndicator.hide();
							this.standardAjaxErrorDisplay(oReject);
						}.bind(this)
					);
			} else {
				BusyIndicator.hide();
				sap.m.MessageToast.show("Records are saved successfully");
			}
		},

		onDeleteItemPress: function (oEvent) {
			oEvent.getSource().destroy();
		},

		/**
		 * Fired when the file size is exceed
		 * @return {undefined} Nothing to return
		 */
		onFileSizeExceed: function () {
			MessageToast.show(this.getResourceBundle().getText("fileSizeError"));
		},

		getCondition: function () {
			var list = this.getView().byId("idFaultPermitList");
			var selPaths = this.getView().byId("idFaultPermitList").getSelectedContextPaths();
			var arr = [];

			for (var i in selPaths) {
				arr.push(Number(selPaths[i].split("/")[2]));
			}
			this.getOwnerComponent().getModel("oModel").getData().conditions = [];
			for (var j in arr) {
				var oData = {
					condition: this.getOwnerComponent().getModel("oModel").getProperty("/permitConditions/" + arr[j]).code,
					comment: this.getOwnerComponent().getModel("oModel").getProperty("/permitConditions/" + arr[j]).comment
				};
				this.getOwnerComponent().getModel("oModel").getData().conditions.push(oData);
			}
			this.getOwnerComponent().getModel("oModel").updateBindings();
		},

		onSubmission: function () {
			var isApplicationId = this.getOwnerComponent().getModel("oModel").getProperty("/isApplicationId");
			this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", isApplicationId.workId);
			this.getView().getModel("oModel").setProperty("/isNavigationFault", true);
			this.getView().getModel("oModel").setProperty("/isPrivateFault", false);

			//PREPARE PRINT
			this.getView().getModel("SummaryModel").setProperty("/WorkTypevisible", true);
			this.getView().getModel("SummaryModel").setProperty("/Permitcondvisible", true);
			this.getView().getModel("SummaryModel").setProperty("/Specialdesignationvisible", true);
			this.getView().getModel("SummaryModel").setProperty("/PrintMode", true);
			this.getOwnerComponent().sPrintId = this.createId("idFaultp3") + "-cont";
			BusyIndicator.show(0);
			var oPromise;
			if (!this.AlterapplicationID) {
				oPromise = ApiFacade.getInstance().submitApplication(isApplicationId.applicationId);
			} else {
				oPromise = ApiFacade.getInstance().submitAlterPermit(this.AlterapplicationID, this.alterationId);
			}
			oPromise.then(function (data) {
					BusyIndicator.hide();
					var message = "Permit " + data.permitReferenceNumber + " submitted";
					if (this.permitMode === "AlterPermit") {
						message = "Permit " + data.permitAlterationReferenceNumber + " submitted";
					}
					this.getView().getModel("SummaryModel").setProperty("/PermitReferenceNo", data.permitAlterationReferenceNumber ? data.permitAlterationReferenceNumber :
						data.permitReferenceNumber);
					this.getView().getModel("SummaryModel").setProperty("/UKPNWorksReferenceNo", data.workReferenceNumber ? data.workReferenceNumber :
						this.getView().getModel("SummaryModel").getProperty("/UKPNWorksReferenceNo"));
					this.getOwnerComponent().getModel("oModel").setProperty("/permitReferenceNumber", message);
					this.getOwnerComponent().getModel("oModel").setProperty("/workReferenceNumber", data.workReferenceNumber);
					sap.m.MessageToast.show("Records are submitted successfully");
					this.getView().getModel("oModel").setProperty("/isErrorFault", false);
					this.oRouter.navTo("PermitSubmit", null, true);
				}.bind(this))
				.catch(function (oReject) {
					BusyIndicator.hide();
					this.standardAjaxErrorDisplay(oReject)
					this.getView().getModel("oModel").setProperty("/isErrorFault", true);
					this.getOwnerComponent().getModel("oModel").setProperty("/isErrorLocation", false);
					this.oRouter.navTo("PermitSubmit", null, true);
				}.bind(this));
		},

		onSelectPrimary: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = this.getView().byId("idPermitPrimaryComBox").getSelectedKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/primaryContractorId", selItem);
				this.removeNotification("PrimaryContractor");
				oEvent.getSource().setValueState("None");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
		},

		onSelectSecondary: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/secondaryContractorId", selItem);
			}
		},

		onSelectTrafficManagementContractor: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var result = oEvent.getParameter("selectedItem").getKey();
				this.getView().getModel("oModel").setProperty("/tmContractorId", result);
			}
		},

		onDepartmentIdentifier: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/departmentIdentifierId", selItem);
			}
		},

		onWorkIdentifier: function (oEvent) {
			this.getView().byId("DTP1").setDateValue(new Date());
			this.getView().getModel("oModel").setProperty("/FaultWorkStartTimeFlag", false);
			if (oEvent.getParameter("selectedItem") !== null) {
				oEvent.getSource().setValueState("None");
				this.removeNotification("WorksIdentifier");

				var selected = oEvent.getParameter("selectedItem").getKey();
				var data = this.getView().getModel("oModel").getProperty("/workIdentifier");
				var duration;
				for (var i = 0; i < data.length; i++) {
					if (data[i].worksIdentifierId.toString() === selected.toString()) {
						duration = data[i].defaultDuration;
						this.getView().byId("idComboActivity").setSelectedKey(data[i].activityType);
						this.getOwnerComponent().getModel("oModel").setProperty("/activityType", data[i].activityType.toLowerCase());
						this.getView().byId("idComboActivity").setValueState("None");
						this.removeNotification("Activity");
						if (data[i].excavationFlag === true) {
							this.getView().byId("idSegmntBtnExcavation").setSelectedKey("yes");
							this.getView().getModel("oModel").setProperty("/excavationRequired", true);
						} else {
							this.getView().byId("idSegmntBtnExcavation").setSelectedKey("no");
							this.getView().getModel("oModel").setProperty("/excavationRequired", false);
						}
						break;
					}
				}
				var endDate = this.getView().byId("idEstimatedEnddate");
				var startDate = this.getView().byId("DTP1").getDateValue();
				var date = new Date(startDate);
				if (duration) {
					var newDate = date.setDate(date.getDate() + duration);
					var oDate = new Date(newDate);
					var eDate = new Date(oDate.getTime());
					this.getView().getModel("oModel").setProperty("/EndDate", eDate.toISOString());
					endDate.setDateValue(eDate);
					this._getCalculatedDays(startDate, eDate);

					var jointingDate;
					var diffDate = oDate.getDate() - startDate.getDate();
					if (diffDate <= 2) {
						jointingDate = startDate;
					} else {
						jointingDate = new Date(oDate.setDate(oDate.getDate() - 2));

					}

					this.getView().getModel("oModel").setProperty("/jointingStartDate", jointingDate.toISOString());
					this.getView().getModel("oModel").setProperty("/jointingEndDate", jointingDate.toISOString());
				} else {
					endDate.setValue("");
					this.getModel("oModel").setProperty("/workingDays", "");
					this.getModel("oModel").setProperty("/calendarDays", "");
				}
				this.getView().byId("WorkLocation").setVisible(true);
				if (oEvent.getParameter("selectedItem") !== null) {
					var selItem = oEvent.getParameter("selectedItem").getKey();
					this.getOwnerComponent().getModel("oModel").setProperty("/workIdentifierId", selItem);
				}
			} else {
				this.getOwnerComponent().getModel("oModel").setProperty("/workIdentifierId", null);
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		onSelectPrivateLand: function (oEvent) {
			var selected = oEvent.getParameter("selected");
			this.getOwnerComponent().getModel("oModel").setProperty("/privateLandFlag", selected);
		},

		onSelectExcavationRequired: function (oEvent) {
			var result = oEvent.getParameter("item").getText() === "Yes" ? true : false;
			this.getOwnerComponent().getModel("oModel").setProperty("/excavationRequired", result);
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},
		onSelectBusStopSuspension: function (oEvent) {
			var result = oEvent.getParameter("item").getText() === "Yes" ? true : false;
			this.getOwnerComponent().getModel("oModel").setProperty("/busStopSuspensionFlag", result);
			this.removeNotification("Bus stop suspension");
			this.validSegmentedButton(this.getView().byId("idBusStopSuspension"), "removeStyleClass");
		},
		onSelectParkingLoadingbaySuspension: function (oEvent) {
			var result = oEvent.getParameter("item").getText() === "Yes" ? true : false;
			this.getOwnerComponent().getModel("oModel").setProperty("/parkingSuspensionFlag", result);
			this.removeNotification("Parking/Loading bay suspension");
			this.validSegmentedButton(this.getView().byId("idParkingSuspension"), "removeStyleClass");
		},

		onActivityType: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/activityType", selItem.toLowerCase());
				oEvent.getSource().setValueState("None");
				this.removeNotification("Activity");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
		},

		onCollaborationType: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var result = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/collaborativeWorkingType", result.toLowerCase());
				this.removeNotification("Collaborationtype");
				oEvent.getSource().setValueState("None");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
		},

		onHighwayAuthority: function () {
			if (this.getView().byId("idHighwayAuthBox").getSelectedItem() !== null) {
				var highwayId = this.getView().byId("idHighwayAuthBox").getSelectedKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/highwayId", highwayId);
			}
		},

		// onEnvironmentFlag: function (oEvent) {
		// 	var result = oEvent.getParameter("item").getText() === "Yes" ? true : false;
		// 	this.getOwnerComponent().getModel("oModel").setProperty("/environmentFlag", result);
		// },

		onOperationZoneSelection: function (oEvent) {
			var selText = "";
			if (oEvent.getParameter("selectedItem") !== null) {
				oEvent.getSource().setValueState("None");
				this.removeNotification("Operationalzone");
				selText = oEvent.getParameter("selectedItem").getText();
				var data = this.getView().getModel("oModel").getProperty("/operational");
				for (var i = 0; i < data.length; i++) {
					if (data[i].description === selText) {
						this.getView().byId("idSecondaryContractor").setSelectedKey(data[i].defaultSecondaryContractor);
						this.getOwnerComponent().getModel("oModel").setProperty("/secondaryContractorId", data[i].defaultSecondaryContractor);
						break;
					}

				}
			}
			this.getOwnerComponent().getModel("oModel").setProperty("/selectedOperationZone", oEvent.getParameter("selectedItem").getKey());
		},

		handleSelectionFinish: function (oEvent) {
			var selItem = oEvent.getParameters("selectedItems").selectedItems;
			var result = "";
			for (var i = 0; i < selItem.length; i++) {
				if (i !== selItem.length - 1) {
					result = result + selItem[i].getText() + ",";
				} else {
					result = result + selItem[i].getText();
				}
			}
			this.getOwnerComponent().getModel("oModel").setProperty("/positionOfWorks", result.toLowerCase());
			oEvent.getSource().setValueState("None");
			this.removeNotification("Positionofworks");
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		onSelectworkPrivateLand: function (oEvent) {
			var selected = oEvent.getParameter("selected");
			this.getOwnerComponent().getModel("oModel").setProperty("/privateLandFlag", selected);
		},

		onselectWRPAuthority: function (evt) {
			this.getOwnerComponent().getModel("oModel").setProperty("/WRPauthorityDisplay", evt.getParameter("selectedItem").getText().split(" - ")[0]);
			this.removeNotification("WrpAuthority");
			evt.getSource().setValueState("None");
		},

		clearData: function () {
			this.getOwnerComponent().setmainModel();
			this.aOldTrafficAttachments = [];
			this.aOldAttachments = [];
			this.setModel(new JSONModel([]), "AttachmentsTrafficModel");
			this.setModel(new JSONModel([]), "AttachmentsModel");
			this.getView().byId("idFaultBackBtn").setVisible(false);
			this.getView().byId("idFaultsaveAndContinue").setVisible(true);
			this.getView().byId("idFaultsubmitPermit").setVisible(false);
			this.getView().byId("idFaultStep1").addStyleClass("clickBorder");
			this.getView().byId("idFaultStep2").removeStyleClass("clickBorder");
			this.getView().byId("idFaultStep3").removeStyleClass("clickBorder");
			this.getView().byId("navCon").to(this.byId("idFaultp1"));
			this.getView().byId("WorkLocation").setVisible(false);
			this.getView().byId("SelectedLocationDetails").setVisible(false);
			this.getView().byId("idEstimatedEnddate").setValue("");
			this.getView().byId("idCollaborativeWorking").setSelectedItem("none");
			this.getView().byId("idCollaborativeWorking").setSelectedKey("no");
			this.getView().byId("idFootwayClosure").setSelectedKey("NO");
			this.getView().byId("CollabDetLabel").setVisible(false);
			this.getView().byId("CollabDetText").setVisible(false);
			this.getView().byId("CollabWorkLabel").setVisible(false);
			this.getView().byId("CollabWorkText").setVisible(false);
			this.getView().byId("CollabTypeLabel").setVisible(false);
			this.getView().byId("CollabTypeBox").setVisible(false);
			this.getView().byId("idSegmntBtnExcavation").setSelectedItem("none");
			this.getView().byId("idSegmntBtnExcavation").setSelectedKey("");
			this.getView().byId("idEnvHealthInput").setValue("");
			this.getView().byId("idBusStopSuspension").setSelectedItem("none");
			this.getView().byId("idBusStopSuspension").setSelectedKey("");
			this.getView().byId("idParkingSuspension").setSelectedItem("none");
			this.getView().byId("idParkingSuspension").setSelectedKey("");
			this.getView().byId("idFaultEnvironmentalSegBtn").setSelectedItem("none");
			this.getView().byId("idFaultEnvironmentalSegBtn").setSelectedKey("");
			this.getView().byId("idEnvHealthLbl").setVisible(false);
			this.getView().byId("idEnvHealthInput").setVisible(false);
			this.getView().byId("idOtherContractorLbl").setVisible(false);
			this.getView().byId("idOtherContractorBox").setVisible(false);
			this.getView().byId("idOtherContractorBtn").setVisible(false);
			this.getView().byId("idAddAnotherBtn").setVisible(true);
			this.getView().byId("idOtherContractorBox").clearSelection();
			this.getView().byId("idFaultMultiPositionofworks").setSelectedKeys([]);
			this.getView().byId("idFaultp2").scrollTo(0);
			this.getView().byId("idFaultp3").scrollTo(0);
			this.getView().byId("idPermitWorkImpactchkbox").setSelected(false);
			this.getView().byId("idFaultWorkLocSpcDesigLink").setText("Hide All");
			this.getView().byId("idFaultWorkDetwrkTypeLink").setText("View Details");
			this.getView().byId("idFaultWorkDetPermitcond").setText("Hide All");
			this.getView().byId("idSegDno").setSelectedItem("none");
			this.getView().byId("idSegDno").setSelectedKey("");
			this.getView().byId("idPersonresponsible").setValue("");
			this.getView().byId("idSegDno").setEnabled(true);
			this.getView().byId("idPersonReponsibleContact").setValue("");
			this.getView().byId("idPlotMap").setEnabled(true);
			this.AlterapplicationID = null;
			this.alterationId = null;
			this.argumentName = null;
			this.getView().getModel("oModel").setProperty("/collaborativeWorking", false);
			this.getView().byId("idEstimatedEnddate").setMinDate(null);
			this.getView().byId("allDesignationSelector").setSelectedKey("");
			this.getView().byId("allDesignationSelector").setSelectedItem("none");
			this.getView().byId("DTP1").setEnabled(true);
			this.getView().byId("idEstimatedEnddate").setEnabled(true);
			//Edit enable
			this.getView().byId("idIncidentprojectnumber").setEnabled(true);
			this.getView().byId("idWorkIdentifier").setEnabled(true);
			this.getView().byId("idComboActivity").setEnabled(true);
			this.getView().byId("idWorkCategory").setEnabled(true);
			this.getView().byId("idHighwayAuthBox").setEnabled(true);
			this.getView().byId("idLocDescription").setEnabled(true);
			this.getView().byId("allDesignationSelector").setEnabled(true);
			this.getView().byId("idFaultMultiPositionofworks").setEnabled(true);
			this.getView().byId("idPermitPrimaryComBox").setEnabled(true);
			this.getView().byId("idTrafficmgmttype").setEnabled(true);
			this.getView().byId("uploadCollectionTraffic").setVisible(true);
			this.getView().byId("idCollaborativeWorking").setEnabled(true);
			this.getView().byId("CollabDetText").setEnabled(true);
			this.getView().byId("CollabWorkText").setEnabled(true);
			this.getView().byId("CollabTypeBox").setEnabled(true);
			this.getView().byId("idSegmntBtnExcavation").setEnabled(true);
			this.getView().byId("idEnvHealthInput").setEnabled(true);
			this.getView().byId("idEnvHealthInput").setVisible(false);
			this.getView().byId("idFaultEnvironmentalSegBtn").setEnabled(true);
			this.getView().byId("idWorksDescription").setEnabled(true);
			this.getView().byId("idCommentstoHighwayAuthority").setEnabled(true);
			this.getView().byId("idFootwayClosure").setEnabled(true);
			this.getView().byId("idFaultPermitList").setMode("MultiSelect");
			this.getView().byId("idLinkPermit").setEnabled(true);
			this.getView().byId("uploadCollection").setVisible(true);
			this.getView().byId("idBtnSave").setVisible(true);
			this.getView().byId("idComboActivity").setValueState("None");
			//set control Value state back to normal
			this.getView().byId("idIncidentprojectnumber").setValueState("None");
			this.getView().byId("idWorkIdentifier").setValueState("None");
			this.getView().byId("idWorkCategory").setValueState("None");
			this.validSegmentedButton(this.getView().byId("idSegDno"), "removeStyleClass");
			this.getView().byId("Usrn").setValueState("None");
			this.getView().byId("idLocDescription").setValueState("None");
			this.getView().byId("idOperationalZone").setValueState("None");
			this.getView().byId("idHighwayAuthBox").setValueState("None");
			this.getView().byId("idFaultMultiPositionofworks").setValueState("None");
			this.getView().byId("idTrafficmgmttype").setValueState("None");
			this.getView().byId("idWorksDescription").setValueState("None");
			this.getView().byId("idPersonresponsible").setValueState("None");
			this.validSegmentedButton(this.getView().byId("idParkingSuspension"), "removeStyleClass");
			this.validSegmentedButton(this.getView().byId("idBusStopSuspension"), "removeStyleClass");
			this.validSegmentedButton(this.getView().byId("idFaultEnvironmentalSegBtn"), "removeStyleClass");
			this.getView().byId("idGroupresponsible").setValue("");
			this.GroupPersonresponsible = null;
			this.getView().byId("idFaultCloseBtn").setVisible(false);
			this.getView().byId("idFaultCancelBtn").setVisible(true);
			// /klldlkfsdkfsdk
			this.getView().byId("idOperationalZone").setEnabled(true);
			this.getView().byId("idPermitWorkImpactchkbox").setEnabled(true);
			this.getView().byId("idSecondaryContractor").setEnabled(true);
			this.getView().byId("idTrafficmgmtcontractorBox").setEnabled(true);
			this.getView().byId("idParkingSuspension").setEnabled(true);
			this.getView().byId("idBusStopSuspension").setEnabled(true);
			this.getView().byId("idEnvHealthInput").setEnabled(true);
			this.getView().byId("idAddAnotherBtn").setEnabled(true);
			this.getView().byId("idOtherContractorBox").setEnabled(true);
			this.getView().byId("idPersonresponsible").setEnabled(true);
			this.getView().byId("idPersonReponsibleContact").setEnabled(true);
			this.getView().byId("idIamResponsible").setEnabled(true);
			this.getView().byId("idGroupresponsible").setEnabled(true);
			this.byId("RefNo").setEnabled(false);
			this.byId("ETONedit").setVisible(true);
			this.byId("ETONcancel").setVisible(false);
			this.byId("RefNo").setValueState("None");
			this.bEtonInDft = false;
			this.bEtonFormat = false;
		},

		handleChangeIncidentProjectNo: function (event) {
			if (event.getParameter("value").length !== 0) {
				event.getSource().setValueState("None");
				this.removeNotification("IncidentProjectNumber");
				var oData = this.getModel("oModel").getData();
				if (oData.selectedDNO && oData.selectedDNO !== "" 
				&& event.getParameter("value").split("-").length > 2) {
					var sWorkNo = "U";
					sWorkNo += oData.selectedDNO.substring(0, 1);
					var sIncidentNumber = event.getParameter("value").trim().split("-")[1];
					while (sIncidentNumber.length < 9) {
						sIncidentNumber = "0" + sIncidentNumber;
					}
					sWorkNo += sIncidentNumber;
					sWorkNo += event.getParameter("value").trim().split("-")[2];
					this.getModel("oModel").setProperty("/workno", sWorkNo);
				}
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		onSelectWorkCategory: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				// var selItem = oEvent.getParameter("selectedItem").getText();
				var selItem = oEvent.getParameter("selectedItem").getKey();
				if (selItem === "immediate_urgent") {
					this.getView().getModel("oModel").setProperty("/workCategory", "immediate_urgent");
				} else {
					this.getView().getModel("oModel").setProperty("/workCategory", "immediate_emergency");
				}
				this.removeNotification("WorkCategory");
				oEvent.getSource().setValueState("None");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
		},

		handleChangeLocationDesc: function (event) {
			if (event.getParameter("value").length !== 0) {
				event.getSource().setValueState("None");
				this.removeNotification("LocationDescription");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
			if(event.getParameter("value") !== this.oldLocDesc){
				this.bLocDescChanged = true;
			}else{
				this.bLocDescChanged = false;
			}
		},
		_openmessagePopOver: function () {
			var oMessagesButton = this.getView().byId("messagePopoverBtn");
			if (!this._messagePopover) {
				this._messagePopover = new MessagePopover({
					items: {
						path: "oModel>/Notifications",
						template: new sap.m.MessageItem({
							description: "{oModel>description}",
							type: "{oModel>type}",
							title: "{oModel>description}",
							subtitle: "{oModel>subtitle}"
						})
					}
				});
				oMessagesButton.addDependent(this._messagePopover);
			}
			this._messagePopover.toggle(oMessagesButton);
		},

		removeNotification: function (title) {
			this.getView().getModel("oModel").getData().Notifications.forEach(function (item, index, object) {
				if (item.title === title) {
					object.splice(index, 1);
				}
			}.bind(this));
			setTimeout(function () {
				this.getOwnerComponent().getModel("oModel").refresh(true);
			}.bind(this), 1000);
		},

		addNotification: function (title, desc, bNotRequiredMsg) {
			this.removeNotification(title);
			this.getView().getModel("oModel").getData().Notifications.push({
				description: bNotRequiredMsg ? desc : desc + " is a required field",
				type: sap.ui.core.MessageType.Error,
				title: title
			});
		},

		_onValidateFields: function () {
			var valid;
			if (this.getView().byId("navCon").getCurrentPage().getNavButtonTooltip() === "LocationDetails") {
				valid = this.validateLocatonFields();
			}

			if (this.getView().byId("navCon").getCurrentPage().getNavButtonTooltip() === "WorkDetails") {
				valid = this.validateWorkDetails();
			}
			return valid;
		},

		validateLocatonFields: function () {
			var valid = true;
			if(this.bEtonInDft){
				valid = false;
				this.addNotification(this.getResourceBundle().getText("UKPN_Works_Reference_Number"),
				this.getResourceBundle().getText("UKPN_Works_Reference_Number") + ": " + this.getResourceBundle().getText("etonError"), true);
			}
			if(this.bEtonFormat){
				valid = false;
				this.addNotification(this.getResourceBundle().getText("UKPN_Works_Reference_Number"),
				this.getResourceBundle().getText("UKPN_Works_Reference_Number") + ": " + this.getResourceBundle().getText("specialCharsError"), true);
			}
			var sErrorText = this.onIncidentNumberValidation("idIncidentprojectnumber");
			if (sErrorText !== null) {
				this.getView().byId("idIncidentprojectnumber").setValueState("Error");
				// this.getView().byId("idIncidentprojectnumber").setValueStateText("Length of Incident/Project number should be 15 characters");
				this.addNotification("IncidentProjectNumber", sErrorText, true);
				valid = false;
			}
			if (this.getView().byId("idWorkIdentifier").getSelectedItem() === null) {
				// if (this.getView().byId("idWorkIdentifier").getSelectedKey().length === 0) {
				this.getView().byId("idWorkIdentifier").setValueState("Error");
				this.addNotification("WorksIdentifier", "Works identifier");
				valid = false;
			}
			if (this.getView().byId("idComboActivity").getSelectedItem() === null) {
				this.getView().byId("idComboActivity").setValueState("Error");
				this.addNotification("Activity", "Activity type");
				valid = false;
			}
			if (this.getView().byId("idWorkCategory").getSelectedItem() === null) {
				this.getView().byId("idWorkCategory").setValueState("Error");
				this.addNotification("WorkCategory", "Work category");
				valid = false;
			}
			if (this.getView().byId("idSegDno").getSelectedItem() === "none") {
				this.addNotification("DNO", "DNO");
				this.validSegmentedButton(this.getView().byId("idSegDno"), "addStyleClass");
			}
			if (this.getView().byId("WorkLocation").getVisible()) {
				if (this.getView().getModel("oModel").getProperty("/USRN").length === 0) {
					this.getView().byId("Usrn").setValueState("Error");
					this.addNotification("USRN", "USRN");
					valid = false;
				}
				if (this.getView().getModel("oModel").getProperty("/LocationDescription").length === 0) {
					this.getView().byId("idLocDescription").setValueState("Error");
					this.addNotification("LocationDescription", "Location description");
					valid = false;
				}
				if (this.getView().byId("idOperationalZone").getSelectedItem() === null) {
					this.getView().byId("idOperationalZone").setValueState("Error");
					this.addNotification("Operationalzone", "Operational zone");
					valid = false;
				}
				// if (this.getView().byId("idHighwayAuthBox").getSelectedItem() === null) {
				// 	this.getView().byId("idHighwayAuthBox").setValueState("Error");
				// 	this.addNotification("HighwayAuthority", "Highway Authority");
				// 	valid = false;
				// }
				if (this.getView().byId("DTP1").getDateValue() === null) {
					this.getView().byId("DTP1").setValueState("Error");
					this.addNotification("StartDate", "Works start date and time");
					valid = false;
				}
				if (this.getView().byId("idEstimatedEnddate").getDateValue() === null) {
					this.getView().byId("idEstimatedEnddate").setValueState("Error");
					this.addNotification("endDate", "Estimated works end date");
					valid = false;
				}
				if (this.getView().byId("idFaultMultiPositionofworks").getSelectedKeys().length === 0) {
					this.getView().byId("idFaultMultiPositionofworks").setValueState("Error");
					this.addNotification("Positionofworks", "Position of works");
					valid = false;
				}
				if (this.getView().byId("idDesignationList").getItems().length !== 0) {
					if (this.Specialdesignations === false) {
						this.addNotification("Specialdesignations", "Special designations");
						valid = false;
					}
				}
				// if (!this.getView().byId("idPermitWorkImpactchkbox").getSelected()) {
				// 	this.getView().byId("idPermitWorkImpactchkbox").setValueState("Error");
				// 	this.addNotification("Workalsoimpactprivateland", "Work also impact private land");
				// 	valid = false;
				// }
			}
			return valid;
		},

		validateWorkDetails: function () {
			var valid = true;
			if (this.getView().byId("idPermitPrimaryComBox").getSelectedItem() === null) {
				this.getView().byId("idPermitPrimaryComBox").setValueState("Error");
				this.addNotification("PrimaryContractor", "Primary Contractor");
				valid = false;
			}
			if (this.getView().byId("idTrafficmgmttype").getSelectedItem() === null) {
				this.getView().byId("idTrafficmgmttype").setValueState("Error");
				this.addNotification("TrafficManagementType", "Traffic Management Type");
				valid = false;
			}
			if (this.getView().byId("idFootwayClosure").getSelectedItem() === null) {
				this.getView().byId("idFootwayClosure").setValueState("Error");
				this.addNotification("FootwayClosure", "Footway Closure");
				valid = false;
			}
			if (this.getView().byId("idCollaborativeWorking").getSelectedKey().toLowerCase() === "yes".toLowerCase()) {
				if (this.getView().getModel("oModel").getProperty("/collaborationDetails").length === 0) {
					this.getView().byId("CollabDetText").setValueState("Error");
					this.addNotification("CollaborationDetails", "Collaboration details");
					valid = false;
				}
				if (this.getView().byId("CollabTypeBox").getSelectedItem() === null) {
					this.getView().byId("CollabTypeBox").setValueState("Error");
					this.addNotification("Collaborationtype", "Collaboration type");
					valid = false;
				}
			}
			if (this.getView().byId("idSegmntBtnExcavation").getSelectedItem() === "none") {
				this.addNotification("Excavation Required", "Excavation Required");
				this.validSegmentedButton(this.getView().byId("idSegmntBtnExcavation"), "addStyleClass");
			}
			// ParkingSuspension
			if (this.getView().byId("idParkingSuspension").getSelectedKey() === "") {
				this.validSegmentedButton(this.getView().byId("idParkingSuspension"), "addStyleClass");
				this.addNotification("Parking/Loading bay suspension", "Parking/Loading bay suspension");
				valid = false;
			}
			//BusStopSuspension
			if (this.getView().byId("idBusStopSuspension").getSelectedKey() === "") {
				this.validSegmentedButton(this.getView().byId("idBusStopSuspension"), "addStyleClass");
				this.addNotification("Bus stop suspension", "Bus stop suspension");
				valid = false;
			}
			if (this.getView().byId("idFaultEnvironmentalSegBtn").getSelectedItem() === "none") {
				this.validSegmentedButton(this.getView().byId("idFaultEnvironmentalSegBtn"), "addStyleClass");
				this.addNotification("AreEnvironmentalHealthNotifiable", "Are Environmental Health Notifiable");
				valid = false;
			}
			if (!this.getView().getModel("oModel").getProperty("/Worksdescription") || this.getView().getModel("oModel").getProperty(
					"/Worksdescription").length === 0) {
				this.getView().byId("idWorksDescription").setValueState("Error");
				this.addNotification("Worksdescription", "Works description");
				valid = false;
			}
			// if (!this.GroupPersonresponsible) {
			// 	this.getView().byId("idPersonresponsible").setValueState("Error");
			// 	this.getView().byId("idGroupresponsible").setValueState("Error");
			// 	this.addNotification("GroupPersonResponsible", "Group/Person responsible");
			// 	valid = false;
			// }
			if (this.getView().byId("idFaultPermitList").getSelectedItems().length !== 0) {
				valid = this.validatePermitConditions();
			}
			return valid;
		},

		validatePermitConditions: function () {
			var bValid = true;
			var list = this.getView().byId("idFaultPermitList");
			var selPaths = this.getView().byId("idFaultPermitList").getSelectedContextPaths();
			var arr = [];

			for (var i in selPaths) {
				arr.push(Number(selPaths[i].split("/")[2]));
			}

			for (var j in arr) {
				var sValue = this.getOwnerComponent().getModel("oModel").getProperty("/permitConditions/" + arr[j]).comment;
				if(!sValue || sValue.trim() === ""){
					bValid = false;
					list.getItems()[arr[j]].getContent()[0].getItems()[1].setValueState("Error");
					this.addNotification(this.getOwnerComponent().getModel("oModel").getProperty("/permitConditions/" + arr[j]).code, 
					this.getOwnerComponent().getModel("oModel").getProperty("/permitConditions/" + arr[j]).code);
				}else{
					this.removeNotification(this.getOwnerComponent().getModel("oModel").getProperty("/permitConditions/" + arr[j]).code);
					list.getItems()[arr[j]].getContent()[0].getItems()[1].setValueState("None");
				}
			}
			if (bValid) {
				this.getCondition();
			}
			if (this.getOwnerComponent().getModel("oModel").getData().Notifications.length !== 0) {
				bValid = false;
			}
			return bValid;
		},

		handleLiveChangeWorksdescription: function (event) {
			if (event.getParameter("value").length !== 0) {
				event.getSource().setValueState("None");
				this.removeNotification("Worksdescription");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
		},

		handleChangecollaborationDetails: function (event) {
			if (event.getParameter("value").length !== 0) {
				event.getSource().setValueState("None");
				this.removeNotification("CollaborationDetails");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
		},

		handleLiveChangeCollabWorkRef: function (event) {
			var regex = /^[a-zA-Z0-9\-\_]*$/;
			if (event.getParameter("value").search(regex) !== 0) {
				event.getSource().setValueState("Error");
				event.getSource().setValueStateText("These special characters are not allowed");
			} else if (event.getParameter("value").length > 24) {
				event.getSource().setValueState("Error");
				event.getSource().setValueStateText("Input values cannot exceed the length 24");
			} else {
				event.getSource().setValueState("None");
				event.getSource().setValueStateText("");
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		handlechangeGroupresponsible: function (event) {
			if (event.getParameter("value").length !== 0) {
				event.getSource().setValueState("None");
				this.removeNotification("Groupresponsible");
			}
		},

		validSegmentedButton: function (ctrl, title) {
			if (title === "addStyleClass") {
				ctrl.addStyleClass("SegBtnbordercolor");
			} else {
				ctrl.removeStyleClass("SegBtnbordercolor");
			}
		},

		handlechangePersonresponsible: function (event) {
			var value = event.getParameter("suggestValue");
			this.getView().getModel("oModel").setProperty("/Person", value);
			if (value.length >= 3) {
				var oCreatePromise = ApiFacade.getInstance().PersonResponsible(value);
				oCreatePromise.then(function (data) {
						data.forEach(function (val) {
							val.givenName = val.givenName + " " + val.surname;
						});
						this.getView().getModel("oModel").setProperty("/personResponsible", data);
					}.bind(this))
					.catch(
						function (oReject) {
							this.standardAjaxErrorDisplay(oReject);
						}.bind(this)
					);
			}
			if (event.getParameter("suggestValue").length !== 0) {
				event.getSource().setValueState("None");
				this.removeNotification("Personresponsible");
			}
		},
		handleHighwayAuthority: function (oEvent) {
			oEvent.getSource().setValueState("None");
			this.removeNotification("HighwayAuthority");
		},
		onPersonSelection: function (oEvent) {
			if(oEvent.getParameter("selectedRow")){
				var selectedItem = oEvent.getParameter("selectedRow").getBindingContext("oModel").getObject().username;
				this.GroupPersonresponsible = selectedItem;
				this.getView().getModel("oModel").setProperty("/PersonResponsible", selectedItem);
				this.getView().byId("idPersonresponsible").setValue(oEvent.getParameters("selectedRow").selectedRow.getBindingContext("oModel").getObject()
					.displayName);
				var data = this.getView().getModel("oModel").getProperty("/personResponsible");
				for (var i = 0; i < data.length; i++) {
					if (data[i].email === selectedItem) {
						// this.getView().byId("idPersonResponsible").setValue(selectedItem);
						if (data[i].telephone === "" || data[i].telephone === null) {
							this.getView().byId("idPersonReponsibleContact").setValue("");
							this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", "");
						} else {
							this.getView().byId("idPersonReponsibleContact").setValue(data[i].telephone);
							this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", data[i].telephone);
						}
						this.getView().getModel("oModel").setProperty("/Requestor", data[i].username);
						break;
					}
				}
				oEvent.getSource().setValueState("None");
				this.getView().byId("idGroupresponsible").setValueState("None");
				this.removeNotification("GroupPersonResponsible");
			}else{
				if (!this.getView().getModel("oModel").getProperty("/WorkingGroupId")) {
					this.GroupPersonresponsible = null;
				}
				oEvent.getSource().setValue("");
				this.getView().getModel("oModel").setProperty("/Person","");
				this.getView().getModel("oModel").setProperty("/PersonResponsible", "");
				this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", "");
				this.getView().getModel("oModel").setProperty("/Requestor","");
			}
		},

		OnSearchMap: function () {
			var oModelData = this.getModel("oModel").getData();
			if (oModelData.geometry && oModelData.geometry.type && oModelData.geometry.coordinates) {
				this.openMap(oModelData.geometry.type, oModelData.geometry.coordinates);
			} else if (oModelData.ApplicationDetails.geometry && oModelData.ApplicationDetails.geometry.type && oModelData.ApplicationDetails.geometry
				.coordinates) {
				this.openMap(oModelData.ApplicationDetails.geometry.type, oModelData.ApplicationDetails.geometry.coordinates);
			} else if (oModelData.Eastings && oModelData.Eastings !== "" && oModelData.Northings && oModelData.Northings !== "") {
				this.openMap("Point", [
					[oModelData.Eastings, oModelData.Northings]
				]);
			} else {
				this.openMap();
			}
		},

		onMapClose: function () {
			if (this.permitMode === "AlterPermit") {
				var sOldUsrn = this.getView().getModel("oModel").getProperty("/usrn").toString();
				if (sOldUsrn && sOldUsrn !== this._oMapData.properties.USRN) {
					return MessageBox.warning(this.getResourceBundle().getText("usrnChangeWarn"));
				}else{
					this.Alterchange = true;
					if(JSON.stringify(this.oldGeometry) !== JSON.stringify(this._oMapData.geometry)){
						this.bGeometryChanged = true;
					}
				}
			}
		if (this.getView().getModel("oModel").getData().ApplicationDetails.assessmentStatus!== undefined && this.getView().getModel("oModel").getData().ApplicationDetails.assessmentStatus ==="refused" && this.getView().getModel("oModel").getData().ApplicationDetails.assessmentStatus !== null){
				var sOldUsrnRef = this.getView().getModel("oModel").getProperty("/usrn").toString();
				if (sOldUsrnRef && sOldUsrnRef !== this._oMapData.properties.USRN) {
					return MessageBox.warning(this.getResourceBundle().getText("usrnChangeWarn"));
				}
			}
		//This Condition is used when the Permit status is refused
			if ( this.PermitStatus!== undefined && this.PermitStatus=== "refused" &&  this.PermitStatus!== null && this.PermitStatus!== "") {
				var sOldUsrnRef = this.getView().getModel("oModel").getProperty("/usrn").toString();
				if (sOldUsrnRef && sOldUsrnRef !== this._oMapData.properties.USRN) {
					return MessageBox.warning(this.getResourceBundle().getText("usrnChangeWarn"));
				}
			}
//This Condition is used when the Permit status is Cancelled		
			if ( this.PermitStatus!== undefined && this.PermitStatus=== "cancelled" &&  this.PermitStatus!== null && this.PermitStatus!== "") {
				var sOldUsrnRef = this.getView().getModel("oModel").getProperty("/usrn").toString();
				if (sOldUsrnRef && sOldUsrnRef !== this._oMapData.properties.USRN) {
					return MessageBox.warning(this.getResourceBundle().getText("usrnChangeWarn"));
				}
			}
//**************End of the Changes ********************************************	
			this.getView().byId("Usrn").setValue(this._oMapData.properties.USRN);
			this.getView().getModel("oModel").setProperty("/usrn", this._oMapData.properties.USRN);
			this.getView().getModel("oModel").setProperty("/geometry", {
				type: this._oMapData.geometry.type,
				coordinates: this._oMapData.geometry.coordinates
			});
			if (this._oMapData.geometry.type === "Point") {
				this.getModel("oModel").setProperty("/Eastings", this._oMapData.geometry.coordinates[0]);
				this.getModel("oModel").setProperty("/Northings", this._oMapData.geometry.coordinates[1]);
			}
			this.getSelectedLocation(this._oMapData.properties.USRN);
		},

		//Get Application details
		getApplicationDetails: function (appId) {
			BusyIndicator.show(0);
			// var sAppId = oData.appId;
			var oCreatePromise;
			oCreatePromise = ApiFacade.getInstance().getApplicationdetails(appId);
			oCreatePromise.then(function (data) {
					this.getView().getModel("oModel").setProperty("/ApplicationDetails", data);
					this._setPrePopulateDta();
					if ((this.permitMode !== "AlterPermit" || this.alterationId) && this.permitMode !== "create") {
						this._loadAttachments(appId);
					}
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},
		_setPrePopulateDta: function () {
			//Location Details Page
			this.getView().byId("WorkLocation").setVisible(true);
			this.getView().byId("SelectedLocationDetails").setVisible(true);
			var mainModel = this.getView().getModel("oModel").getProperty("/");
			var data = mainModel.ApplicationDetails;
			if((data.isAnOldPermit || !data.workStatusValue) && this.permitMode === "edit"){
				this.getView().getModel("oModel").setProperty("/ETONedit", true);
			}
			this.getView().getModel("oModel").setProperty("/geometry", data.geometry);
			this.oldGeometry = JSON.parse(JSON.stringify(data.geometry));
			this.oldLocDesc = JSON.parse(JSON.stringify(data.locationDescription));
			this.bGeometryChanged = false;
			this.bLocDescChanged = false;
			this.getView().getModel("oModel").setProperty("/workno", data.workOrderNumber);
			this.getView().getModel("oModel").setProperty("/UKPNWorksReferenceNumber", data.workReferenceNumber);
			this.getView().getModel("oModel").setProperty("/workoperationno", data.workOrderOperationNumber);

			this.getView().getModel("SummaryModel").setProperty("/PermitReferenceNo", data.permitReferenceNumber);
			this.getView().getModel("SummaryModel").setProperty("/UKPNWorksReferenceNo", data.workReferenceNumber);
			this.getView().getModel("SummaryModel").setProperty("/SAPWorkOrderNo", data.workOrderNumber);
			this.getView().getModel("SummaryModel").setProperty("/SAPWorkOrderOperationsNo", data.workOrderOperationNumber);

			this.getModel("oModel").setProperty("/IncidentProjectNumber", data.incidentReference);
			// this.getView().getModel("oModel").setProperty("/workIdentifier", data.worksIdentifier === null ? null : data.worksIdentifier);
			this.getView().getModel("oModel").setProperty("/workIdentifierId", data.worksIdentifier);
			// data.worksIdentifier = data.worksIdentifier === null ? null : data.worksIdentifier.toUpperCase();
			data.worksIdentifier = data.worksIdentifier === null ? null : data.worksIdentifier;
			this.getView().getModel("oModel").setProperty("/activityType", data.activityType === null ? null : data.activityType.toLowerCase());
			data.activityType = data.activityType === null ? null : data.activityType.toUpperCase();
			this.getModel("oModel").setProperty("/workCategory", data.workCategory);
			if (data.workType === "planned") {
				this.getModel("oModel").setProperty("/workCategory", "immediate_urgent");
			}
			if (data.dno !== null) {
				this.getView().byId("idSegDno").setSelectedKey(data.dno);
				this.getView().byId("idSegDno").setEnabled(false);
			} else {
				this.getView().byId("idSegDno").setEnabled(true);
			}
			this.getView().getModel("oModel").setProperty("/Eastings", data.geometry.coordinates[0]);
			this.getView().getModel("oModel").setProperty("/Northings", data.geometry.coordinates[1]);
			this.getView().getModel("oModel").setProperty("/selectedDNO", data.dno);
			if (data.usrn !== null) {
				if (this.permitMode === "edit") {
					this.argumentName = null;
				}
				this.getSelectedLocation(data.usrn);
				this.getView().getModel("oModel").setProperty("/usrn", data.usrn);
			}
			//Work Details
			if (this.permitMode !== "create") {
				this.getView().getModel("oModel").setProperty("/jointingFlag", data.jointingRequiredFlag);
				this.getView().getModel("oModel").setProperty("/jointingStartDate", data.jointingStartDate);
				this.getView().getModel("oModel").setProperty("/jointingEndDate", data.jointingEndDate);
			}
			this.getView().getModel("oModel").setProperty("/USRN", data.usrn === null ? "" : data.usrn);
			this.getView().getModel("oModel").setProperty("/selectedOperationZone", data.operationalZone);
			var resultArray = this.getView().getModel("oModel").getProperty("/allData");
			var newArray = resultArray.filter(function (param) {
				return param.dno === data.dno;
			});
			this.getView().getModel("oModel").setProperty("/operational", newArray);
			this.getView().getModel("oModel").setProperty("/LocationDescription", data.locationDescription === null ? "" : data.locationDescription);
			if (data.proposedStartDate !== null) {
				this.getView().getModel("oModel").setProperty("/StartDate", new Date(data.proposedStartDate));
				// this.getView().byId("DTP1").setEnabled(false);
			}
			if (data.proposedEndDate !== null) {
				this.getView().getModel("oModel").setProperty("/endDate", new Date(data.proposedEndDate));
				//	this.getView().byId("idEstimatedEnddate").setEnabled(false);
			}
			this.getView().byId("idEstimatedEnddate").setMinDate(data.proposedStartDate ? new Date(data.proposedStartDate) : null);
			// else {
			// 	this.getView().byId("idEstimatedEnddate").setEnabled(true);
			// }
			this.getView().getModel("oModel").setProperty("/endDate", new Date(data.proposedEndDate));
			this.getView().getModel("oModel").setProperty("/EndDate", new Date(data.proposedEndDate));
			this._getCalculatedDays(new Date(data.proposedEndDate), new Date(data.proposedEndDate));
			this.getOwnerComponent().getModel("oModel").setProperty("/positionOfWorks", data.positionOfWorks);
			data.positionOfWorks = data.positionOfWorks === null ? null : data.positionOfWorks.toUpperCase().split(",");
			this.getView().byId("idFaultMultiPositionofworks").setSelectedKeys(data.positionOfWorks);
			this.getView().getModel("oModel").setProperty("/privateLandFlag", data.privateLandFlag);
			this.getView().byId("idPermitWorkImpactchkbox").setSelected(data.privateLandFlag);
			//Work Details Page
			this.getView().getModel("oModel").setProperty("/trafficType", data.trafficManagementType);
			this.getView().getModel("oModel").setProperty("/trafficTypeKey", data.trafficManagementType === null ? null : data.trafficManagementType
				.toLowerCase());
			data.trafficManagementType = data.trafficManagementType === null ? null : data.trafficManagementType.toUpperCase();
			// data.trafficManagementContractorId = data.trafficManagementContractorId === null ? null : data.trafficManagementContractorId.toUpperCase();
			data.closeFootway = data.closeFootway === null ? null : data.closeFootway.toUpperCase();
			this.getView().getModel("oModel").setProperty("/footwayClosureKey", data.closeFootway === null ? null : data.closeFootway.toLowerCase());
			// data.collaborativeWorkingFlag = data.collaborativeWorkingFlag === true ? "yes" : "no";
			data.collaborativeWorkingFlag = this._getTruefalseflag(data.collaborativeWorkingFlag);
			if (data.collaborativeWorkingFlag === "yes") {
				this.getView().byId("CollabDetLabel").setVisible(true);
				this.getView().byId("CollabDetText").setVisible(true);
				this.getView().byId("CollabWorkLabel").setVisible(true);
				this.getView().byId("CollabWorkText").setVisible(true);
				this.getView().byId("CollabTypeLabel").setVisible(true);
				this.getView().byId("CollabTypeBox").setVisible(true);
			} else if (data.collaborativeWorkingFlag === "no") {
				this.getView().byId("CollabDetLabel").setVisible(false);
				this.getView().byId("CollabDetText").setVisible(false);
				this.getView().byId("CollabWorkLabel").setVisible(false);
				this.getView().byId("CollabWorkText").setVisible(false);
				this.getView().byId("CollabTypeLabel").setVisible(false);
				this.getView().byId("CollabTypeBox").setVisible(false);
				this.removeNotification("CollaborationDetails");
				this.removeNotification("Collaborationtype");
				this.getView().byId("CollabDetText").setValueState("None");
				this.getView().byId("CollabTypeBox").setValueState("None");
				this.getView().getModel("oModel").setProperty("/collaborativeWorking", false);
			} else {
				this.getView().getModel("oModel").setProperty("/collaborativeWorking", data.collaborativeWorkingFlag);
			}
			this.getView().getModel("oModel").setProperty("/busStopSuspensionFlag", data.busStopSuspensionFlag);
			data.busStopSuspensionFlag = this._getTruefalseflag(data.busStopSuspensionFlag);
			this.getView().getModel("oModel").setProperty("/parkingSuspensionFlag", data.parkingSuspensionFlag);
			data.parkingSuspensionFlag = this._getTruefalseflag(data.parkingSuspensionFlag);
			this.getView().getModel("oModel").setProperty("/excavationRequired", data.excavationFlag);
			// data.excavationFlag = data.excavationFlag === true ? "yes" : "no";
			data.excavationFlag = this._getTruefalseflag(data.excavationFlag);
			this.getView().getModel("oModel").setProperty("/environmentFlag", data.environmentalFlag ? true : false);
			// data.environmentalFlag = data.environmentalFlag === true ? "yes" : "no";
			data.environmentalFlag = this._getTruefalseflag(data.environmentalFlag);
			data.collaborationType = data.collaborationType === null ? null : data.collaborationType.toUpperCase();
			this.getView().getModel("oModel").setProperty("/Collaborationworksreference", data.collaborativeWorks);
			this.getView().getModel("oModel").setProperty("/collaborationDetails", data.collaborationDetails);
			this.getView().getModel("oModel").setProperty("/collaborativeWorking", data.collaborativeWorkingFlag === "yes" ? true : false);
			this.getView().getModel("oModel").setProperty("/collaborativeWorkingType", data.collaborationType === null ? null : data.collaborationType
				.toLowerCase());
			if (data.otherContractorId !== null) {
				this.onAddOtherContractor();
			}
			this.getView().getModel("oModel").setProperty("/Worksdescription", data.workDescription === null ? "" : data.workDescription);
			this.getView().byId("idPersonresponsible").setValue(data.personResponsibleDisplayText === null ? "" : data.personResponsibleDisplayText);
			this.getView().getModel("oModel").setProperty("/PersonResponsible", data.personResponsible === null ? "" : data.personResponsible);
			this.getView().getModel("oModel").setProperty("/personResponsible", data.personResponsible === null ? "" : data.personResponsible);
			this.getView().getModel("oModel").setProperty("/Person", data.personResponsible === null ? "" : data.personResponsible);
			this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", data.personResponsiblePhone === null ? "" : data.personResponsiblePhone);
			this.getView().getModel("oModel").setProperty("/Requestor", data.personResponsible);
			this.getView().byId("idGroupresponsible").setValue(data.workingGroupId === null ? "" : data.workingGroupId);
			var workingGroupSetInterval = setInterval(function () {
				if (this.getView().getModel("SuggestModel").getData()) {
					this.getView().getModel("SuggestModel").getData().forEach(function (item) {
						if (data.workingGroupId === item.workingGroupId) {
							this.getView().byId("idGroupresponsible").setValue(item.groupName);
							this.getView().getModel("SummaryModel").setProperty("/Groupresponsible", item.groupName);
							clearInterval(workingGroupSetInterval);
						}
					}.bind(this));
				}
			}.bind(this), 1000);

			if (data.workingGroupId || data.personResponsible) {
				if (data.workingGroupId) {
					this.GroupPersonresponsible = data.workingGroupId;
				} else if (data.personResponsible) {
					this.GroupPersonresponsible = data.personResponsible;
				}
			} else {
				this.GroupPersonresponsible = null;
			}
			// this.getView().getModel("oModel").setProperty("/CommentstoHighwayAuthority", data.CommentstoHighwayAuthority);
			this._setPermitConditions(data.conditions);
			this.getView().getModel("oModel").setProperty("/ApplicationDetails", data);

			if (this.permitMode === "AlterPermit") {
				if (this.alterationId) {
					this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", {
						applicationId: this.AlterapplicationID,
						workId: data.workId
					});
				} else {
					this.AlterapplicationID = data.applicationId;
				}
				if (data.workStatusValue === "In Progress") {
					this.getView().byId("DTP1").setEnabled(false);
				}
			}
			if (this.permitMode === "edit" || this.byId("idFaultDiscard").getVisible()) {
				this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", {
					applicationId: data.applicationId,
					workId: data.workId
				});
				// this._getCommentstoLocalAuthority(data.applicationId);
			}
			this._getCommentstoLocalAuthority(data.applicationId);
			if (this.permitMode === "InternalEdit") {
				this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", {
					applicationId: data.applicationId
				});
				this.getModel("oModel").setProperty("/workCategory", data.workCategory);
				this._setInternalEditFields();
			}
			if (this.permitMode === "edit") {
				this.getView().byId("idSegDno").setEnabled(true);
			}
			if (this.permitMode === "AlterPermit") {
				this.getView().byId("idOperationalZone").setEnabled(false);
				this.getView().byId("idPermitWorkImpactchkbox").setEnabled(false);
				this.getView().byId("idSecondaryContractor").setEnabled(false);
				this.getView().byId("idTrafficmgmtcontractorBox").setEnabled(false);
				this.getView().byId("idParkingSuspension").setEnabled(false);
				this.getView().byId("idBusStopSuspension").setEnabled(false);
				this.getView().byId("idAddAnotherBtn").setEnabled(false);
				this.getView().byId("idEnvHealthInput").setEnabled(false);
				this.getView().byId("idOtherContractorBox").setEnabled(false);
				this.getView().byId("idPersonresponsible").setEnabled(false);
				this.getView().byId("idPersonReponsibleContact").setEnabled(false);
				this.getView().byId("idIamResponsible").setEnabled(false);
				this.getView().byId("idGroupresponsible").setEnabled(false);
			}
			//Changes for USNr Field to be Disable in case of Alter and Permit Type to be refuse
			if (this.permitMode === "AlterPermit") {
				if(data.statusValue !== null && data.statusValue !== undefined){
					if(data.statusValue == "Refused"){
						this.byId("Usrn").setEnabled(false);
					}
				}
			}
		},

		_loadAttachments: function (appId) {
			ApiFacade.getInstance().getApplicationFiles(appId)
				.then(function (oData) {
					oData.forEach(function (oFile) {
						if (oFile.fileType === "WORK_FILE") {
							this.aOldAttachments.push(new sap.m.UploadCollectionItem({
								fileName: oFile.filename,
								ariaLabelForPicture: oFile.fileId.toString(),
								url: oFile.link
							}));
						} else {
							this.aOldTrafficAttachments.push(new sap.m.UploadCollectionItem({
								fileName: oFile.filename,
								ariaLabelForPicture: oFile.fileId.toString(),
								url: oFile.link
							}));
						}
					}.bind(this));
					this.setModel(new JSONModel({
						attachments: this.aOldTrafficAttachments
					}), "AttachmentsTrafficModel");
					this.setModel(new JSONModel({
						attachments: this.aOldAttachments
					}), "AttachmentsModel");
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_setPermitConditions: function (conditions) {
			var items = this.getView().byId("idFaultPermitList").getItems();
			items.forEach(function (item, index, object) {
				for (var j in conditions) {
					if (item.getContent()[0].getItems()[0].getText().indexOf(conditions[j].condition) !== -1) {
						item.setSelected(true);
						var path = item.getBindingContextPath();
						var oInput = item.getContent()[0].getItems()[1];
						oInput.setValue(conditions[j].comment);
						oInput.setEnabled(false);
						this.getView().getModel("oModel").setProperty(path + "/visible", true);
					}
				}
			}.bind(this));
		},

		_setSpecialDesignations: function () {
			var data = this.getOwnerComponent().getModel("oModel").getProperty("/ApplicationDetails");
			this.Specialdesignations = true;
			var model = this.getOwnerComponent().getModel("oModel");
			// this.getView().getModel("SummaryModel").setProperty("/SpecialdesignationLength", data.specialDesignations.length);
			var oDesig = this.getView().byId("idDesignationList").getItems();
			data.specialDesignations.forEach(function (selItem) {
				oDesig.forEach(function (item) {
					if (JSON.stringify(item.getCells()[2].getBindingContext("oModel").getObject()) === JSON.stringify(selItem)) {
						item.getCells()[item.getCells().length - 1].setSelectedKey("yes");
						model.getData().selectedSplDesignations.push(model.getProperty(item.getBindingContextPath()));
					}
				}.bind(this));
				this.getView().getModel("SummaryModel").getData().Specialdesignations.push({
					designation: selItem.special_desig_description
				});
			}.bind(this));
			this.getView().getModel("SummaryModel").setProperty("/SpecialdesignationLength", this.getView().getModel("SummaryModel").getProperty(
				"/Specialdesignations").length);
		},

		_setSapKeyData: function () {
			this.getView().byId("WorkLocation").setVisible(true);
			this.getView().byId("SelectedLocationDetails").setVisible(true);
			var data = this.getOwnerComponent().getModel("SAPdataModel").getData();
			this.getView().getModel("oModel").setProperty("/ApplicationDetails", data);
			this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", {
				applicationId: data.applicationId
			});
			this.getOwnerComponent().getModel("oModel").setProperty("/workno", data.workOrderNo);
			this.getOwnerComponent().getModel("oModel").setProperty("/workoperationno", "0030");
		},
		_getTruefalseflag: function (val) {
			var bValid;
			if (val === true) {
				bValid = "yes";
			} else if (val === false) {
				bValid = "no";
			} else {
				bValid = val;
			}
			return bValid;
		},

		onPressiamResponsible: function () {
			var userData = this.getModel("UserProfileModel").getData();
			this.getView().getModel("oModel").setProperty("/Person", userData.displayName);
			this.getView().getModel("oModel").setProperty("/PersonResponsible", userData.username);
			this.getView().getModel("oModel").setProperty("/Requestor", userData.email);
			this.getView().byId("idPersonresponsible").setValue(userData.displayName);
			this.getView().byId("idPersonresponsible").setValueState("None");
			this.getView().byId("idGroupresponsible").setValueState("None");
			this.GroupPersonresponsible = userData.givenName;
			this.removeNotification("GroupPersonResponsible");
			if (userData.telephone === "" || userData.telephone === null) {
				this.getView().byId("idPersonReponsibleContact").setValue("");
				this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", "");
			} else {
				this.getView().byId("idPersonReponsibleContact").setValue(userData.telephone);
				this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", userData.telephone);
			}
		},

		_setInternalEditFields: function () {
			this.getView().byId("idOperationalZone").setEnabled(true);
			this.getView().byId("idPermitWorkImpactchkbox").setEnabled(true);
			this.getView().byId("idSecondaryContractor").setEnabled(true);
			this.getView().byId("idTrafficmgmtcontractorBox").setEnabled(true);
			this.getView().byId("idParkingSuspension").setEnabled(true);
			this.getView().byId("idBusStopSuspension").setEnabled(true);
			this.getView().byId("idAddAnotherBtn").setEnabled(true);
			this.getView().byId("idOtherContractorBox").setEnabled(true);
			this.getView().byId("idOtherContractorBtn").setEnabled(true);
			this.getView().byId("idPersonresponsible").setEnabled(true);
			//Disable Location details 
			this.getView().byId("idIncidentprojectnumber").setEnabled(false);
			this.getView().byId("idWorkIdentifier").setEnabled(false);
			this.getView().byId("idComboActivity").setEnabled(false);
			this.getView().byId("idWorkCategory").setEnabled(false);
			this.getView().byId("idSegDno").setEnabled(false);
			this.getView().byId("idPlotMap").setEnabled(false);
			this.getView().byId("idLocDescription").setEnabled(false);
			this.getView().byId("idHighwayAuthBox").setEnabled(false);
			this.getView().byId("DTP1").setEnabled(false);
			this.getView().byId("idEstimatedEnddate").setEnabled(false);
			this.getView().byId("allDesignationSelector").setEnabled(false);
			this.getView().byId("idFaultMultiPositionofworks").setEnabled(false);
			//Disable Work details
			this.getView().byId("idPermitPrimaryComBox").setEnabled(false);
			this.getView().byId("idTrafficmgmttype").setEnabled(false);
			this.getView().byId("uploadCollectionTraffic").setVisible(false);
			this.getView().byId("idFootwayClosure").setEnabled(false);
			this.getView().byId("idCollaborativeWorking").setEnabled(false);
			this.getView().byId("CollabDetText").setEnabled(false);
			this.getView().byId("CollabWorkText").setEnabled(false);
			this.getView().byId("CollabTypeBox").setEnabled(false);
			this.getView().byId("idSegmntBtnExcavation").setEnabled(false);
			this.getView().byId("idFaultEnvironmentalSegBtn").setEnabled(false);
			if (this.getView().getModel("oModel").getData().ApplicationDetails.environmentalFlag === "yes") {
				this.getView().byId("idEnvHealthLbl").setVisible(true);
				this.getView().byId("idEnvHealthInput").setVisible(true);
				this.getView().byId("idEnvHealthInput").setEnabled(true);
			} else {
				this.getView().byId("idEnvHealthLbl").setVisible(false);
				this.getView().byId("idEnvHealthInput").setVisible(false);
				this.getView().byId("idEnvHealthInput").setEnabled(false);
			}
			this.getView().byId("idWorksDescription").setEnabled(false);
			this.getView().byId("idLinkPermit").setEnabled(false);
			this.getView().byId("idCommentstoHighwayAuthority").setEnabled(false);
			this.getView().byId("idDesignationList").getItems().forEach(function (item) {
				item.getCells()[8].setEnabled(false);
			});
			this.getView().byId("idFaultPermitList").setMode("None");
			this.getView().byId("uploadCollection").setVisible(false);
		},

		//Get Comments
		_getCommentstoLocalAuthority: function (appId) {
			BusyIndicator.show(0);
			var oCreatePromise;
			oCreatePromise = ApiFacade.getInstance().getHighwayAuthoritycomments(appId);
			oCreatePromise.then(function (data) {
					var arr = [];
					data.forEach(function (item) {
						if (item.commentType === "EXTERNAL") {
							arr.push(item);
						}
					});
					this.getView().getModel("SummaryModel").setProperty("/CommentstoHighwayAuthority", arr);
					// this.getView().getModel("oModel").setProperty("/CommentstoHighwayAuthority", data.length !== 0 ? data[0].commentText : "");
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		getWorkinggroup: function () {
			var oPromise = ApiFacade.getInstance().getWorkingGroup();
			oPromise.then(function (data) {
				var model = new JSONModel(data);
				model.setSizeLimit(data.length);
				this.getView().setModel(model, "SuggestModel");
			}.bind(this));
			return oPromise;
		},

		onsuggestionGroupSelected: function (evt) {
			if (evt.getParameter("selectedItem")) {
				this.GroupPersonresponsible = evt.getParameter("selectedItem").getKey();
				this.getView().byId("idPersonresponsible").setValueState("None");
				this.getView().byId("idGroupresponsible").setValueState("None");
				this.getView().getModel("oModel").setProperty("/WorkingGroupId", Number(evt.getParameter("selectedItem").getKey()));
				this.getView().getModel("SummaryModel").setProperty("/Groupresponsible", evt.getParameter("selectedItem").getText());
				this.removeNotification("GroupPersonResponsible");
			} else if(!evt.getSource().getSelectedItem()){
				if (!this.getView().getModel("oModel").getProperty("/PersonResponsible")) {
					this.GroupPersonresponsible = null;
				}
				this.getView().getModel("oModel").setProperty("/WorkingGroupId", "");
				this.getView().getModel("SummaryModel").setProperty("/Groupresponsible", "");
				evt.getSource().setValue("");
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		_getInitialData: function () {
			BusyIndicator.show();
			var aPromises = [];
			aPromises.push(this.getActivity());
			aPromises.push(this.getContractorAll());
			aPromises.push(this.getTrafficManagement());
			aPromises.push(this.getOperationalZone());
			aPromises.push(this.getCollaborationType());
			aPromises.push(this.getLocationType());
			aPromises.push(this.getPermitconditions());
			aPromises.push(this.getFootwayClosure());
			aPromises.push(this.getWorkIdentifier());
			aPromises.push(this.getWorkinggroup());

			Promise.all(aPromises).then(function (aData) {
					BusyIndicator.hide();
				}.bind(this))
				.catch(function (oReject) {
					BusyIndicator.hide();
					this.standardAjaxErrorDisplay(oReject);
				}.bind(this));
		},

		onETONedit: function(){
			this.sOldEton = this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber");
			this.byId("RefNo").setEnabled(true);
			this.byId("ETONedit").setVisible(false);
			this.byId("ETONcancel").setVisible(true);
		},

		onETONcancel: function(){
			this.getModel("oModel").setProperty("/UKPNWorksReferenceNumber", this.sOldEton);
			this.byId("RefNo").setEnabled(false);
			this.byId("ETONedit").setVisible(true);
			this.byId("ETONcancel").setVisible(false);
			this.byId("RefNo").setValueState("None");
			this.bEtonInDft = false;
			this.bEtonFormat = false;
		},

		checkETON: function(){
			var regex = /^[a-zA-Z0-9]*$/;
			if (this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber").search(regex) !== 0) {
				this.bEtonFormat = true;
				this.byId("RefNo").setValueState("Error");
				this.byId("RefNo").setValueStateText(this.getResourceBundle().getText("specialCharsError"));
			}else{
				this.bEtonFormat = false;
				this.removeNotification(this.getResourceBundle().getText("UKPN_Works_Reference_Number"));
				this.byId("RefNo").setValueState("None");
				ApiFacade.getInstance().checkETON(this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber"))
				.then(function (data) {
					this.bEtonInDft = true;
					this.byId("RefNo").setValueState("Error");
					this.byId("RefNo").setValueStateText(this.getResourceBundle().getText("etonError"));
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						if(oReject.error.status !== 404){
							this.standardAjaxErrorDisplay(oReject);
						}else{
							this.byId("RefNo").setValueState("None");
							this.bEtonInDft = false;
							this.removeNotification(this.getResourceBundle().getText("UKPN_Works_Reference_Number"));
						}
					}.bind(this)
				);
			}
		}
	});
});