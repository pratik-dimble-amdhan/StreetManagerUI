sap.ui.define([
	"project1/controller/base/BaseController",
	"jquery.sap.global",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessagePopover",
	"sap/m/MessagePopoverItem",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"sap/m/UploadCollectionParameter",
	"project1/util/Formatter",
	"project1/services/apiFacade",
	"sap/ui/core/BusyIndicator"
], function (BaseController, jQuery, JSONModel, MessagePopover, MessagePopoverItem, MessageBox, MessageToast, UploadCollectionParameter,
	Formatter, ApiFacade, BusyIndicator) {
	"use strict";
	return BaseController.extend("project1.controller.LocationDetails", {
		formatter: Formatter,
		Specialdesignations: false,
		AgreementBtn: null,
		AgreemntSave: false,
		preApprovalDetails: null,
		preApprovalAuthoriser: null,
		earlyStart: null,
		AgreeDialog: null,
		onSaveAndContinue: false,
		aOldTrafficAttachments: [],
		aOldAttachments: [],
		permitMode: "",
		AlterapplicationID: null,
		alterationId: null,
		draftAlterationId: null,
		argumentName: null,
		CalculateWorkCategory: false,
		// AgreemntCancel: false,
		Alterchange: null,
		bchangeUSRN: false,

		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("PlannedPermit").attachPatternMatched(this.onRoutemacth, this);
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
			this.byId("idPermitDiscard").setVisible(false);
			this.getView().getModel("oModel").setProperty("/isErrorLocation", false);
			this.getView().getModel("oModel").setProperty("/isNavigationFault", false);
			this.getView().getModel("oModel").setProperty("/ApplicationDetails/selectedAgreebutton", "");
			this.clearData();
			this.setDevicewidth();
			this.getContractorAll();
			this.getWorkCategories();
			this.getTrafficManagement();
			this.getOperationalZone();
			this.getCollaborationType();
			this.getLocationType();
			this.getPermitconditions();
			this.getActivity();
			this.getTtReason();
			this.getFootwayClosure();
			this.getWorkIdentifier();
			this.getDepartmentIdentifier();
			this._getSpecialDesignationData();
			this.createSummaryModel();
			this.AgreementBtn = null;
			if (this.permitMode === "edit") {
				this.getView().getModel("oModel").setProperty("/permitMode", "Edit");
			} else if (this.permitMode === "InternalEdit") {
				this.getView().getModel("oModel").setProperty("/permitMode", "Internal edit");
			} else if (this.permitMode === "AlterPermit") {
				this.getView().getModel("oModel").setProperty("/permitMode", "Alter");
			} else if (this.permitMode === "create") {
				this.getView().getModel("oModel").setProperty("/permitMode", "Create");
			}
			this.getView().getModel("oModel").setProperty("/ETONedit", false);
			if (this.permitMode === "create" || this.permitMode === "PAA") {
				if (evt.getParameter("arguments").NAME1 === "PermitReference" || evt.getParameter("arguments").NAME1 === "ApplicationId") {
					this.argumentName = evt.getParameter("arguments").NAME1;
					this.getApplicationDetails(evt.getParameter("arguments").PARAM1);
				} else if (evt.getParameter("arguments").NAME1 === "sapkey") {
					this.getView().getModel("oModel").setProperty("/ETONedit", true);
					if (this.getOwnerComponent().getModel("SAPdataModel") !== undefined) {
						this.sapkey = evt.getParameter("arguments").PARAM1;
						this._setSapKeyData();
					} else {
						this.doNavTo("SapRequest", {
							sapkey: evt.getParameter("arguments").PARAM1
						});
					}
				} else if (evt.getParameter("arguments").NAME1 === "DraftApplicationId") {
					this.argumentName = "ApplicationId";
					this.byId("idPermitDiscard").setVisible(true);
					this.getApplicationDetails(evt.getParameter("arguments").PARAM1);
				} else {
					if (this.formatter.checkDevUrl(this.getResourceBundle().getText("environment"))) {
						this.getView().getModel("oModel").setProperty("/ETONedit", true);
					} else {
						this.doNavTo("RouteHome");
					}
				}
			}

			if (this.permitMode === "edit") {
				this.byId("idPermitDiscard").setVisible(true);
			}

			if (this.permitMode === "edit" || this.permitMode === "InternalEdit") {
				// if (evt.getParameter("arguments").NAME1 === "PermitReference" || evt.getParameter("arguments").NAME1 === "ApplicationId") {
				if (evt.getParameter("arguments").NAME1 === "ApplicationId") {
					this.getApplicationDetails(evt.getParameter("arguments").PARAM1);
				}
			}

			if (this.permitMode === "AlterPermit") {
				if (evt.getParameter("arguments").NAME1 === "PermitReference" || evt.getParameter("arguments").NAME1 === "ApplicationId") {
					this.argumentName = evt.getParameter("arguments").NAME1;
					if (evt.getParameter("arguments").PARAM1.indexOf("_AlterationId=") !== -1) {
						this.byId("idPermitDiscard").setVisible(true);
						this.AlterapplicationID = evt.getParameter("arguments").PARAM1.split("_AlterationId=")[0];
						this.alterationId = evt.getParameter("arguments").PARAM1.split("_AlterationId=")[1].split("&")[0];
						this.draftAlterationId = evt.getParameter("arguments").PARAM1.split("_AlterationId=")[1].split("&")[1];
						this.getApplicationDetails(this.alterationId);
					} else {
						this.getApplicationDetails(evt.getParameter("arguments").PARAM1);
					}
				}
			}
		},

		setDevicewidth: function () {
			if (sap.ui.Device.resize.width === 1280) {
				this.getView().byId("idPermitNavCon").setHeight("19em");
			} else if (sap.ui.Device.resize.width >= 1024) {
				this.getView().byId("idPermitNavCon").setHeight("42em");
			} else {
				this.getView().byId("idPermitNavCon").setHeight("70em");
			}
		},

		//Get Work Categories//
		getWorkCategories: function (event) {
			var oPromise = ApiFacade.getInstance().getStaticData("WORK_CATEGORY");
			oPromise.then(function (data) {
					this.setModel(new JSONModel(data), "workCategories");
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject)
					}.bind(this)
				);
			return oPromise;
		},

		//Contractors - Primary, Secondary, Traffic Management and Others
		getContractorAll: function () {
			$.ajax({
				type: "GET",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/contractors",
				contentType: "application/json",
				async: false,
				success: function (data) {
					// console.log(odata);
					// debugger;
					// var primaryContractor = data.filter(value => value.primary === true);
					// var secondaryContractor = data.filter(value => value.secondary === true);
					// var tmContractor = data.filter(value => value.tm === true);
					// var otherContractor = data.filter(value => value.other === true);
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
					this.getView().getModel("oModel").updateBindings();
					this.getView().getModel("oModel").updateBindings();
					// console.log(this.getView().getModel("oModel").getData());
					// sap.m.MessageToast.show("Success");
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}
			});
		},
		//SAP Location Details
		getSapworkdetails: function () {
			$.ajax({
				type: "GET",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/sap-work-details/1",
				contentType: "application/json",
				async: false,
				success: function (data) {
					// console.log(data);
					this.getView().getModel("oModel").setProperty("/sapkey", data.sapkey);
					this.getView().getModel("oModel").setProperty("/workno", data.workno);
					this.getView().getModel("oModel").setProperty("/workoperationno", data.workoperationno);
					this.getView().getModel("oModel").updateBindings();
					// console.log(this.getView().getModel("oModel").getData());
					// sap.m.MessageToast.show("Success");
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}
			});
		},
		//Traffic Management
		getTrafficManagement: function () {
			$.ajax({
				type: "GET",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/static-data/traffic-management",
				contentType: "application/json",
				async: false,
				success: function (data) {
					// console.log(data);
					this.getView().getModel("oModel").setProperty("/trafficManagementType", data);
					this.getView().getModel("oModel").updateBindings();
					// console.log(this.getView().getModel("oModel").getData());
					// sap.m.MessageToast.show("Success");
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}
			});
		},
		//Operational Zone
		getOperationalZone: function () {
			$.ajax({
				type: "GET",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/operational-zones",
				async: false,
				contentType: "application/json",
				success: function (data) {
					// console.log(data);
					var uniqueArray = [];
					var filterArray = [];
					// var filterArray= [... new Set(data)];
					for (var i = 0; i < data.length; i++) {
						if (uniqueArray.indexOf(data[i].dno) === -1) {
							uniqueArray.push(data[i].dno);
							filterArray.push(data[i]);
						}
					}
					this.getView().getModel("oModel").setProperty("/allData", data);
					this.getView().getModel("oModel").setProperty("/operationalZone", filterArray);
					this.getView().getModel("oModel").updateBindings();
					// console.log(this.getView().getModel("oModel").getData());
					if (this.getModel("oModel").getProperty("/ApplicationDetails/dno")) {
						this.onSelectDNO();
					}
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}
			});
		},
		//Collaboration Type
		getCollaborationType: function () {
			$.ajax({
				type: "GET",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/static-data/collaborations",
				contentType: "application/json",
				async: false,
				success: function (data) {
					// console.log(data);
					this.getView().getModel("oModel").setProperty("/collaborationType", data);
					this.getView().getModel("oModel").updateBindings();
					// console.log(this.getView().getModel("oModel").getData());
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}.bind(this)
			});
		},
		//Location Type
		getLocationType: function () {
			$.ajax({
				type: "GET",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/static-data/locations",
				contentType: "application/json",
				async: false,
				success: function (data) {
					// console.log(data);
					this.getView().getModel("oModel").setProperty("/locationType", data);
					this.getView().getModel("oModel").updateBindings();
					// console.log(this.getView().getModel("oModel").getData());
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}.bind(this)
			});
		},

		//Selected Location, Hioghway Authority
		getSelectedLocation: function (highwayNo) {
			// var token = null;
			$.ajax({
				type: "GET",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/street-lookup/search/" + highwayNo,
				headers: {
					"x-csrf-token": "fetch"
				},
				contentType: "application/json",
				async: false,
				success: function (odata) {
					this.getView().byId("Usrn").setValueState("None");
					this.removeNotification("USRN");

					this.getView().getModel("oModel").setProperty("/roadCategory", odata.roadCategory);
					this.getView().getModel("oModel").setProperty("/area", odata.area);
					this.getView().getModel("oModel").setProperty("/town", odata.town);
					this.getView().getModel("oModel").setProperty("/street", odata.streetDescriptor);
					this.getView().getModel("oModel").setProperty("/trafficSensitive", odata.trafficSensitive);
					var address;
					// token = xhr.getResponseHeader("X-CSRF-Token");
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

					// var HighwayAuthorityArray = [];
					var HighwayAuthorityArray = odata.primaryNoticeAuthorities;
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
							this.getView().byId("idPermitHighwayAuthBox").setEnabled(false);
						} else {
							this.getView().byId("multipleHighWay").setVisible(true);
							// this.getView().byId("multipleHighWayLocation").setVisible(true);
							this.getView().byId("idPermitHighwayAuthBox").setEnabled(true);
						}
					} else {
						this.getView().byId("multipleHighWay").setVisible(false);
						// this.getView().byId("multipleHighWayLocation").setVisible(false);
						this.getView().byId("idPermitHighwayAuthBox").setSelectedItem(this.getView().byId("idPermitHighwayAuthBox").getItems()[0]);
						this.getView().byId("idPermitHighwayAuthBox").setEnabled(false);
						if (this.getView().byId("idPermitHighwayAuthBox").getSelectedItem() !== null) {
							this.removeNotification("HighwayAuthority");
						}
						this.getView().byId("idPermitHighwayAuthBox").setValueState("None");
					}
					this.getView().getModel("oModel").setProperty("/specialDesignation", []);
					this.getView().getModel("oModel").setProperty("/specialDesignation", odata.additionalSpecialDesignations);
					this.getView().getModel("oModel").setProperty("/LaneRentalFlag", false);
					if (odata.additionalSpecialDesignations.length === 0) {
						this.getView().byId("idPermitDesignationList").setVisible(false);
						this.getView().byId("specailDesignation").setVisible(false);
						this.getView().byId("allDesignationSelector").setVisible(false);
					} else {
						odata.additionalSpecialDesignations.forEach(function (oDesignation) {
							if (oDesignation.street_special_desig_code === 16) {
								this.getView().getModel("oModel").setProperty("/LaneRentalFlag", true);
							}
						}.bind(this));
						this.getView().byId("specailDesignation").setVisible(true);
						this.getView().byId("idPermitDesignationList").setVisible(true);
						this.getView().byId("allDesignationSelector").setVisible(true);
					}
					this.getView().getModel("oModel").setProperty("/SelectedLocation", odata);
					this.getView().getModel("oModel").updateBindings();
					if (this.getView().getModel("oModel").getData().ApplicationDetails.length !== 0) {
						this._setSpecialDesignations();
					}
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}
			});
		},

		handlesubmitUSRN: function (evt) {
			// this.gethighwayAuthority(evt.getParameter("value"));
			this.getView().getModel("oModel").setProperty("/usrn", evt.getParameter("value"));
			this.getSelectedLocation(evt.getParameter("value"));
		},
		//Permit Conditions	
		getPermitconditions: function () {
			// var url = "https:" + "//streetmanager-dev-api.cfapps.eu20.hana.ondemand.com";
			$.ajax({
				type: "GET",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/permits/options",
				contentType: "application/json",
				async: false,
				success: function (odata) {
					// console.log(odata);
					for (var i in odata) {
						odata[i].visible = false;
					}
					this.getView().getModel("oModel").setProperty("/permitConditions", odata);
					this.getView().getModel("oModel").updateBindings();
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}
			});
		},

		getActivity: function () {
			var token = null;
			$.ajax({
				type: "GET",
				async: false,
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/static-data/activities",
				contentType: "application/json",
				success: function (odata) {
					this.getView().getModel("oModel").setProperty("/activities", odata);
					this.getView().getModel("oModel").updateBindings();
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				},
				beforeSend: function (xhr) {
					xhr.setRequestHeader("X-CSRF-Token", "Fetch");
				},
				complete: function (xhr) {
					token = xhr.getResponseHeader("X-CSRF-Token");
					this.getOwnerComponent().getModel("oModel").setProperty("/CSRFToken", token);
					this.getOwnerComponent().CSRFToken = token;
				}.bind(this)
			});
		},

		getTtReason: function () {
			$.ajax({
				type: "GET",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/static-data/ttro",
				contentType: "application/json",
				async: false,
				success: function (odata) {
					this.getView().getModel("oModel").setProperty("/ttReason", odata);
					this.getView().getModel("oModel").updateBindings();
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}
			});
		},

		getFootwayClosure: function () {
			$.ajax({
				type: "GET",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/static-data/footway-closure",
				contentType: "application/json",
				async: false,
				success: function (data) {
					// console.log(data);
					this.getView().getModel("oModel").setProperty("/footwayclosure", data);
					this.getView().getModel("oModel").updateBindings();
					// console.log(this.getView().getModel("oModel").getData());
					// sap.m.MessageToast.show("Success");
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}
			});
		},

		getWorkIdentifier: function () {
			$.ajax({
				type: "GET",
				// url: "/streetmanager-api/api/v1/static-data/works-identifier",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/works-identifier",
				contentType: "application/json",
				async: false,
				success: function (data) {
					// console.log(data);
					this.getView().getModel("oModel").setProperty("/workIdentifier", data);
					this.getView().getModel("oModel").updateBindings();
					// console.log(this.getView().getModel("oModel").getData());
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}
			});
		},

		getDepartmentIdentifier: function () {
			$.ajax({
				type: "GET",
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/departments",
				contentType: "application/json",
				async: false,
				success: function (data) {
					// console.log(data);
					this.getView().getModel("oModel").setProperty("/departmentIdentifier", data);
					this.getView().getModel("oModel").updateBindings();
					// console.log(this.getView().getModel("oModel").getData());
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}
			});
		},
		//Calculate Work Category//
		getWorkCategory: function (event) {
			BusyIndicator.show(0);
			var mainModel = this.getOwnerComponent().getModel("oModel").getProperty("/");
			var sRoadCategory = this.getView().getModel("oModel").getProperty("/roadCategory");
			var sTrafficSensitive = this.getView().getModel("oModel").getProperty("/trafficSensitive");
			var oData = {
				workType: "PLANNED",
				isTtroRequired: mainModel.isTtroRequired,
				proposedStartDate: new Date(new Date(mainModel.valid_from).toString().split("GMT")[0] + " UTC").toISOString().split(".")[0],
				proposedEndDate: new Date(new Date(mainModel.valid_to).toString().split("GMT")[0] + " UTC").toISOString().split(".")[0],
				roadCategory: sRoadCategory,
				trafficSensitive: sTrafficSensitive
			};
			var oCreatePromise = ApiFacade.getInstance().WorkCategory(oData);
			oCreatePromise.then(function (data) {
					this.getView().getModel("oModel").setProperty("/workType", data.work_category);
					this.getView().getModel("oModel").setProperty("/isEarlyStart", data.is_early_start);
					this.getView().getModel("oModel").setProperty("/SlidingStatic", data.sliding_static);
					this.getView().getModel("oModel").setProperty("/LatestStartDate", data.latest_start_date);
					this.CalculateWorkCategory = true;
					this.removeNotification("CalculateWorkCategory");
					this.validSegmentedButton(this.getView().byId("idCalculateWorkCategory"), "removeStyleClass");
					if (data.is_early_start) {
						this.jumpTo("idAgreementWorktypeFormDisplay");
					} else {
						this.jumpTo("idPermitSecondaryContractor");
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

		onchangeSelect: function (evt) {
			this.removeNotification("TTRN/TTRO required");
			this.validSegmentedButton(this.getView().byId("idTTROTTRN"), "removeStyleClass");
			if (evt.getSource().getSelectedKey() === "yes") {
				this.getView().byId("idTTRNreasonlab").setVisible(true);
				this.getView().byId("idTTRNreasonBox").setVisible(true);
				this.getView().byId("idTTRNobtainedLab").setVisible(true);
				this.getView().byId("idTTRNobtainedBox").setVisible(true);
				this.getView().getModel("oModel").setProperty("/isTtroRequired", true);
			} else {
				this.getView().byId("idTTRNreasonlab").setVisible(false);
				this.getView().byId("idTTRNreasonBox").setVisible(false);
				this.getView().byId("idTTRNobtainedLab").setVisible(false);
				this.getView().byId("idTTRNobtainedBox").setVisible(false);
				this.getView().getModel("oModel").setProperty("/isTtroRequired", false);
				this.removeNotification("TTRN/TTRO obtained");
				this.removeNotification("TTRN/TTRO reason");
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		onchangeCollaborative: function (evt) {
			if (evt.getSource().getSelectedKey() === "yes") {
				this.getView().byId("CollabDetLabel").setVisible(true);
				this.getView().byId("CollabDetText").setVisible(true);
				this.getView().byId("CollabWorkLabel").setVisible(true);
				this.getView().byId("CollabWorkText").setVisible(true);
				this.getView().byId("CollabTypeLabel").setVisible(true);
				this.getView().byId("idPermitCollabTypeBox").setVisible(true);
				this.getView().getModel("oModel").setProperty("/collaborativeWorking", true);
			} else if (evt.getSource().getSelectedKey() === "no") {
				this.getView().byId("CollabDetLabel").setVisible(false);
				this.getView().byId("CollabDetText").setVisible(false);
				this.getView().byId("CollabWorkLabel").setVisible(false);
				this.getView().byId("CollabWorkText").setVisible(false);
				this.getView().byId("CollabTypeLabel").setVisible(false);
				this.getView().byId("idPermitCollabTypeBox").setVisible(false);
				this.removeNotification("CollaborationDetails");
				this.removeNotification("Collaborationtype");
				this.getView().byId("CollabDetText").setValueState("None");
				this.getView().byId("idPermitCollabTypeBox").setValueState("None");
				this.getView().getModel("oModel").setProperty("/collaborativeWorking", false);
			} else {
				this.getView().getModel("oModel").setProperty("/collaborativeWorking", null);
			}
			this.validSegmentedButton(this.getView().byId("idPermitCollaborativeWorking"), "removeStyleClass");
			this.removeNotification("Collaborative working");
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
			// var result = evt.getParameter("item").getText() === "Yes" ? true : false;
			// this.getView().getModel("oModel").setProperty("/collaborativeWorking", result);
		},

		onPressCalculateWOtype: function () {
			this.getView().byId("idWorktypeFormEdit").setVisible(false);
			this.getView().byId("idWorktypeFormDisplay").setVisible(true);
			this.getWorkCategory();
		},

		onSelectCheck: function (evt) {
			var selected = evt.getParameter("selected");
			this.getView().getModel("oModel").setProperty("/jointingFlag", selected);
			if (evt.getParameter("selected")) {
				this.getView().byId("idtxtJoindate").setVisible(false);
				this.getView().byId("idtxtJoindatePicker").setVisible(false);
				this.getView().getModel("SummaryModel").setProperty("/Jointingdate", "");
				this.getView().getModel("oModel").setProperty("/Jointingdate", "");
				this.getView().getModel("oModel").setProperty("/jointingFlag", false);
			} else {
				this.getView().byId("idtxtJoindate").setVisible(true);
				this.getView().byId("idtxtJoindatePicker").setVisible(true);
				this.getView().byId("idtxtJoindatePicker").setValue("");
				this.getView().getModel("oModel").setProperty("/jointingFlag", true);
			}
			this.getView().byId("idtxtJoindatePicker").setValueState("None");
			this.removeNotification("JointingDate");
		},

		onPressEditworkType: function () {
			this.CalculateWorkCategory = false;
			this.getView().byId("idWorktypeFormEdit").setVisible(true);
			this.getView().byId("idWorktypeFormDisplay").setVisible(false);
			this.getView().byId("idAgreementWorktypeFormDisplay").setVisible(false);
			if (this.getView().getModel("oModel").getProperty("/Jointingdate")) {
				this.getView().byId("idtxtJoindatePicker").setDateValue(new Date(this.getView().getModel("oModel").getProperty("/Jointingdate")));
			}
		},

		onSelectTrafficmgmtype: function (evt) {
			if (evt.getParameter("selectedItem") !== null) {
				var result = evt.getParameter("selectedItem");
				this.getView().getModel("oModel").setProperty("/trafficType", result.getText());
				this.getView().getModel("oModel").setProperty("/trafficTypeKey", result.getKey().toLowerCase());
				// this.getView().byId("idAttachTMplanLbl").setVisible(true);
				// this.getView().byId("idAttachFileBtn").setVisible(true);
				this.removeNotification("TrafficManagementType");
				evt.getSource().setValueState("None");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
			// else {
			// 	this.getView().byId("idAttachTMplanLbl").setVisible(false);
			// 	this.getView().byId("idAttachFileBtn").setVisible(false);
			// }
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

		onPressAddAgreement: function () {
			if (!this.AgreeDialog) {
				this.AgreeDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.Agreement", this);
				this.getView().addDependent(this.AgreeDialog);

			}
			this.AgreeDialog.open();
		},

		onPressCancel: function () {
			this.AgreeDialog.close();
		},

		handleConfirmationMessageBoxPress: function (oEvent) {
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			MessageBox.confirm(
				"Do you want to cancel the application? If cancelled all unsaved data lost.", {
					styleClass: bCompact ? "sapUiSizeCompact" : ""
				}
			);
		},

		handleChange: function (val) {
			var startDate = this.getView().byId("idWorksStartDate");
			var endDate = this.getView().byId("idWorksEnddate");
			if (val === "start" && startDate.isValidValue()) {
				endDate.setDateValue(null);
				endDate.setMinDate(startDate.getDateValue());
				endDate.setValueState("None");
				startDate.setValueState("None");
				this.removeNotification("ProposedWorksStartDate");
				this.getView().getModel("oModel").setProperty("/Proposedworkdate", "");
				return;
			} else if (!startDate.isValidValue()) {
				startDate.setValueState("Error");
				endDate.setDateValue(null);
				endDate.setValueState("None");
				this.removeNotification("ProposedWorksEnddate");
			}

			if (endDate.isValidValue()) {
				endDate.setValueState("None");
				this.removeNotification("ProposedWorksEnddate");
			} else {
				endDate.setValueState("Error");
			}
			if (startDate.isValidValue() && endDate.isValidValue() && startDate.getDateValue() && endDate.getDateValue()) {
				this.getView().byId("WorkLocation").setVisible(true);
				var valid_from = startDate.getDateValue();
				var valid_to = endDate.getDateValue();
				this._getCalculatedDays(valid_from, valid_to);
				var DateRange = moment(valid_from).format('DD MMM YYYY') + " - " + moment(valid_to).format('DD MMM YYYY');
				this.getView().getModel("oModel").setProperty("/workdateRange", DateRange);
				this.getView().getModel("oModel").setProperty("/Proposedworkdate", DateRange);
				this.getView().getModel("oModel").setProperty("/valid_from", valid_from);
				this.getView().getModel("oModel").setProperty("/valid_to", valid_to);
				this.getView().getModel("SummaryModel").setProperty("/Workdaterange", DateRange);
				this.getView().byId("idtxtJoindatePicker").setMinDate(valid_from);
				this.getView().byId("idtxtJoindatePicker").setMaxDate(valid_to);
				this.removeNotification("Proposedworkdate");
				this.getView().byId("idtxtJoindatePicker").setValue("");
			} else {
				this.getView().getModel("oModel").setProperty("/Proposedworkdate", "");
			}
			if (this.permitMode !== "AlterPermit") {
				// Jointingdate field get update here if user change Proposed end date
				this.CalculateWorkCategory = false;
				this.getView().byId("idWorktypeFormEdit").setVisible(true);
				this.getView().byId("idWorktypeFormDisplay").setVisible(false);
				this.getView().byId("idAgreementWorktypeFormDisplay").setVisible(false);
				this.getView().byId("idJointingChkbox").setSelected(false);
				this.getView().byId("idtxtJoindatePicker").setVisible(true);
				this.getView().getModel("oModel").setProperty("/Jointingdate", "");
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		OnSearchLocation: function () {
			this.OnSearchMap();
			this.getView().byId("SelectedLocationDetails").setVisible(true);
		},

		onSummaryStep: function () {
			this.getView().byId("saveAndContinue").setVisible(false);
			this.getView().byId("submitPermit").setVisible(true);
		},

		onSelectDNO: function () {
			var resultArray = this.getView().getModel("oModel").getProperty("/allData");
			// var newArray = resultArray.filter(value => value.dno === oEvent.getParameter("selectedItem").getText());
			var newArray = resultArray.filter(function (param) {
				return param.dno === this.byId("idComboDNO").getSelectedItem().getText();
			}.bind(this));
			this.getView().getModel("oModel").setProperty("/operational", newArray);
			var selText = this.byId("idComboDNO").getSelectedItem().getText();
			this.getView().getModel("oModel").setProperty("/selectedDNO", selText);
			var items = this.getView().byId("idPermitPrimaryComBox").getItems();

			for (var i in items) {
				if (items[i].getText().indexOf(selText) !== -1) {
					this.getView().byId("idPermitPrimaryComBox").setSelectedItem(items[i]);
				}
			}
			this.byId("idComboDNO").setValueState("None");
			this.removeNotification("DNO");
		},

		onSubmitPermit: function () {
			if (this.Alterchange) {
				MessageBox.confirm(
					"This is your last chance to edit any details before this permit application is submitted. \n \n Please ensure all details are correct before completing this application", {
						title: "Please confirm all details",
						initialFocus: "Confirm Permit Submission",
						actions: [MessageBox.Action.CANCEL, "Confirm Permit Submission"],
						onClose: function (oAction) {
							if (oAction !== MessageBox.Action.CANCEL) {
								this.onSubmission();
							}
						}.bind(this)
					});
			} else {
				MessageBox.warning(this.getView().getModel("i18n").getResourceBundle().getText("alterchangeMsg"));
			}
		},

		// onAddAttachment: function () {
		// 	// AttachmentDialog: null,
		// 	if (!this.AttachmentDialog) {
		// 		this.AttachmentDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.AddAttachment", this);
		// 		this.getView().addDependent(this.AttachmentDialog);
		// 	}
		// 	this.AttachmentDialog.open();
		// 	// var oFileUploader = sap.ui.getCore().byId("idAttachUploader");
		// 	// oFileUploader.setValue();
		// 	// this.AttachmentDialog.close();
		// },

		// onBeforeUploadStarts: function () {
		// 	// debugger;
		// 	var Url = "/streetmanager-api/api/v1/applications/" + this.getView().getModel("oModel").getProperty("/isApplicationId").applicationId +
		// 		"/multipart-files";
		// 	this.getView().getModel("oModel").setProperty("/upLoadURL", Url);
		// },

		// onStartUpload: function(oEvent) {
		// 	var oUploadCollection = this.byId("PicUploadCollection");
		// 	var cFiles = oUploadCollection.getItems().length;
		// 	var Url = "/streetmanager-api/api/v1/applications/" + this.getView().getModel("oModel").getProperty("/isApplicationId").applicationId +
		// 		"/multipart-files";
		// 	oUploadCollection.setUploadUrl(Url);

		// 	if (cFiles > 0) {
		// 		oUploadCollection.upload(Url);
		// 	}
		// },
		// onAddFiles: function () {
		// 	var oFileUploader = sap.ui.getCore().byId("idAttachUploader");
		// 	if (!oFileUploader.getValue()) {
		// 		sap.m.MessageToast.show("Choose a file first");
		// 		return;
		// 	}
		// 	var isApplicationId = this.getOwnerComponent().getModel("oModel").getProperty("/isApplicationId");
		// 	$.ajax({
		// 		type: "POST",
		// 		url: "/streetmanager-api/api/v1/applications/" + isApplicationId.applicationId + "/files",
		// 		headers: {
		// 			"Content-Type": "multipart/form-data"
		// 		},
		// 		contentType: "application/json",
		// 		success: function (data) {
		// 			this.oFileUploader.upload();
		// 			MessageToast.show("Files attached successfully");
		// 		}.bind(this),
		// 		error: function (error) {
		// 			var err = JSON.parse(error.responseText);
		// 			MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
		// 		}.bind(this)
		// 	});
		// },

		// ExportPopOver: null,
		// onExport: function (oEvent) {
		// 	if (!this.ExportPopOver) {
		// 		this.ExportPopOver = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.Export", this);
		// 		this.getView().addDependent(this.ExportPopOver);
		// 	}
		// 	this.ExportPopOver.openBy(oEvent.getSource());
		// },

		// onExportPDF: function (oEvent) {
		// 	var pdf = new jsPDF();
		// 	pdf.addHTML($("#name").get(0), function () {
		// 		pdf.save("form.pdf");
		// 	});
		// },

		// onPrint: function () {
		// window.print();
		// var oTarget = this.byId("FormDisplay480_Trial"); // getting the id of control to be print
		// var $domTarget = oTarget.$()[0], //getting the div of the body
		// 	sTargetContent = $domTarget.innerHTML,
		// 	sOriginalContent = document.body.innerHTML;

		// document.body.innerHTML = sTargetContent;
		// window.print();
		//document.body.innerHTML = sOriginalContent;
		// },

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

		onEarlyAgreement: function () {
			if (!this.EarlyAgreementDialog) {
				this.EarlyAgreementDialog = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.EarlyStartAgreement", this);
				this.getView().addDependent(this.EarlyAgreementDialog);
			}
			// this.clearEarlyAgreement();
			if (this.AgreementBtn !== null) {
				this.onCheckAgreement();
			}

			//Add Location details for Add Agreemnt 
			this._getLocationAgreement();

			if (this.getView().getModel("oModel").getProperty("/ApplicationDetails/selectedAgreebutton") === "yes") {
				sap.ui.getCore().byId("idFormEarltAggrmnt1").setVisible(true);
				sap.ui.getCore().byId("idFormEarltAggrmnt2").setVisible(true);
				sap.ui.getCore().byId("idFormEarltAggrmnt3").setVisible(false);
			} else if (this.getView().getModel("oModel").getProperty("/ApplicationDetails/selectedAgreebutton") === "no") {
				sap.ui.getCore().byId("idFormEarltAggrmnt1").setVisible(false);
				sap.ui.getCore().byId("idFormEarltAggrmnt2").setVisible(false);
				sap.ui.getCore().byId("idFormEarltAggrmnt3").setVisible(true);
			}
			this.EarlyAgreementDialog.open();
		},

		onCheckAgreement: function () {
			if (this.AgreementBtn.toLowerCase() === "Yes".toLowerCase()) {
				sap.ui.getCore().byId("idDialogSegbtn").setSelectedKey("yes");
				sap.ui.getCore().byId("idFormEarltAggrmnt1").setVisible(true);
				sap.ui.getCore().byId("idFormEarltAggrmnt2").setVisible(true);
				sap.ui.getCore().byId("idFormEarltAggrmnt3").setVisible(false);
			} else if (this.AgreementBtn.toLowerCase() === "No".toLowerCase()) {
				sap.ui.getCore().byId("idDialogSegbtn").setSelectedKey("no");
				sap.ui.getCore().byId("idFormEarltAggrmnt1").setVisible(false);
				sap.ui.getCore().byId("idFormEarltAggrmnt2").setVisible(false);
				sap.ui.getCore().byId("idFormEarltAggrmnt3").setVisible(true);
			} else {
				sap.ui.getCore().byId("idDialogSegbtn").setSelectedKey("");
				this.getView().getModel("oModel").setProperty("/ApplicationDetails/selectedAgreebutton", "");
			}
		},

		clearEarlyAgreement: function () {
			sap.ui.getCore().byId("idPreApprovalDetails").setValue("");
			sap.ui.getCore().byId("idPreApprovalAuthoriser").setValue("");
			sap.ui.getCore().byId("idEarlyStartReason").setValue("");
			sap.ui.getCore().byId("idDialogSegbtn").setSelectedButton("none");
			sap.ui.getCore().byId("idDialogSegbtn").setSelectedKey("none");
			sap.ui.getCore().byId("idPreApprovalDetails").setValueState("None");
			sap.ui.getCore().byId("idPreApprovalAuthoriser").setValueState("None");
			sap.ui.getCore().byId("idEarlyStartReason").setValueState("None");
		},

		onOutofHours: function (oEvent) {
			var result = oEvent.getParameter("item").getText();
			this.getView().getModel("oModel").setProperty("/outofhour", result);
		},

		onParkingSuspension: function (oEvent) {
			var result = oEvent.getParameter("item").getText();
			this.getView().getModel("oModel").setProperty("/parkingSuspension", result);
		},

		onWRP: function (oEvent) {
			var result = oEvent.getParameter("item").getText();
			this.getView().getModel("oModel").setProperty("/wrp", result === "Yes" ? true : false);
			this.validSegmentedButton(this.getView().byId("idSegWRP"), "removeStyleClass");
			this.removeNotification("Wrp");
			if (result === "Yes") {
				this.getWRPAuthority();
				this.getView().byId("idWrpAuthorityLbl").setVisible(true);
				this.getView().byId("idWrpAuthorityBox").setVisible(true);
				this.getView().getModel("SummaryModel").setProperty("/WRP", result);
			} else {
				this.getView().byId("idWrpAuthorityLbl").setVisible(false);
				this.getView().byId("idWrpAuthorityBox").setVisible(false);
				this.getView().getModel("SummaryModel").setProperty("/WRP", result);
				this.getView().byId("idWrpAuthorityBox").clearSelection();
				this.getView().getModel("oModel").updateBindings();
				this.getOwnerComponent().getModel("oModel").setProperty("/WRPauthorityDisplay", "");
				this.removeNotification("WrpAuthority");
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		handleChangeJointDate: function (oEvent) {
			var result = oEvent.getParameter("value");
			if (result.length !== 0) {
				var oDate = oEvent.getSource().getDateValue();
				if (!oDate) {
					oDate = new Date(this.getModel("oModel").getProperty("/valid_from"));
				}
				this.getView().getModel("oModel").setProperty("/jointingFlag", true);
				this.getView().getModel("oModel").setProperty("/jointingDate", oDate);
				this.getView().getModel("oModel").setProperty("/Jointingdate", oDate);
				this.getView().getModel("SummaryModel").setProperty("/Jointingdate", oDate);
				this.byId("idtxtJoindatePicker").setDateValue(oDate);
				this.getView().byId("idtxtJoindatePicker").setValueState("None");
				this.removeNotification("JointingDate");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
		},
		onSelectionChangeSegbutton: function (evt) {
			if (evt.getParameter("item").getText() === "Yes") {
				sap.ui.getCore().byId("idFormEarltAggrmnt1").setVisible(true);
				sap.ui.getCore().byId("idFormEarltAggrmnt2").setVisible(true);
				sap.ui.getCore().byId("idFormEarltAggrmnt3").setVisible(false);
			} else {
				sap.ui.getCore().byId("idFormEarltAggrmnt1").setVisible(false);
				sap.ui.getCore().byId("idFormEarltAggrmnt2").setVisible(false);
				sap.ui.getCore().byId("idFormEarltAggrmnt3").setVisible(true);
			}
		},

		onPressCancelEarlyAgreement: function () {
			if (this.AgreementBtn === "yes") {
				if (this.getOwnerComponent().getModel("oModel").getProperty("/preApprovalDetails") !== "" || this.getOwnerComponent().getModel(
						"oModel").getProperty("/preApprovalAuthoriser") !== "") {
					this.getOwnerComponent().getModel("oModel").setProperty("/earlyStartReason", "");
				}
			} else {
				if (this.getOwnerComponent().getModel("oModel").getProperty("/earlyStartReason") !== "") {
					this.getOwnerComponent().getModel("oModel").setProperty("/preApprovalDetails", "");
					this.getOwnerComponent().getModel("oModel").setProperty("/preApprovalAuthoriser", "");
				}
			}
			if (this.AgreemntSave === false) {
				if (this.earlyStart === null) {
					this.getOwnerComponent().getModel("oModel").setProperty("/earlyStartReason", "");
				} else if (this.preApprovalDetails === null || this.preApprovalAuthoriser === null) {
					this.getOwnerComponent().getModel("oModel").setProperty("/preApprovalDetails", "");
					this.getOwnerComponent().getModel("oModel").setProperty("/preApprovalAuthoriser", "");
				}
			} else {
				if (this.preApprovalDetails !== null && this.preApprovalAuthoriser !== null) {
					this.getOwnerComponent().getModel("oModel").setProperty("/preApprovalDetails", this.preApprovalDetails);
					this.getOwnerComponent().getModel("oModel").setProperty("/preApprovalAuthoriser", this.preApprovalAuthoriser);
				} else if (this.earlyStart !== null) {
					this.getOwnerComponent().getModel("oModel").setProperty("/earlyStartReason", this.earlyStart);
				}
			}
			sap.ui.getCore().byId("idPreApprovalDetails").setValueState("None");
			sap.ui.getCore().byId("idPreApprovalAuthoriser").setValueState("None");
			sap.ui.getCore().byId("idEarlyStartReason").setValueState("None");
			this.EarlyAgreementDialog.close();
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

		onSelectchkbox: function (evt) {
			var path = evt.getParameter("listItem").getBindingContextPath();
			var desc = JSON.parse(JSON.stringify(evt.getParameter("listItem").getBindingContext("oModel").getObject().description));
			if (desc.indexOf("-") !== -1) {
				desc = desc.split("-")[1];
			}
			if (!this.getView().getModel("oModel").getProperty(path + "/comment") ||
				this.getView().getModel("oModel").getProperty(path + "/comment") == "") {
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

		onChangeCondition: function (oEvent) {
			var sValue = oEvent.getSource().getValue();
			if (!sValue || sValue.trim() === "") {
				oEvent.getSource().setValueState("Error");
			} else {
				oEvent.getSource().setValueState("None");
			}
		},

		onSelectOtherContractor: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/otherContractorId", selItem);
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		onAddOtherContractor: function (oEvent) {
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
			this.getView().getModel("oModel").updateBindings();
			this.getView().byId("idOtherContractorBox").clearSelection();
			this.getView().getModel("oModel").setProperty("/otherContractorId", "");
			this.getView().getModel("SummaryModel").setProperty("/Othercontractor", "N/A");
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
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
				Externalreference: "N/A",
				ProjectReference: "",
				PersonresponsContactdetails: "N/A",
				PrintMode: false
			};
			var oModel = new JSONModel(data);
			this.getView().setModel(oModel, "SummaryModel");
		},

		onBackNav: function (evt) {
			this.onSavePress();
			var oPage = this.getView().byId("idPermitNavCon").getCurrentPage().getNavButtonTooltip();
			if (oPage === "WorkDetails") {
				this.getView().byId("idPermitp1").scrollTo(10, 100);
				this.getView().byId("idPermitNavCon").to(this.byId("idPermitp1"));
				this.getView().byId("idPermitBackBtn").setVisible(false);
				this.getView().byId("idPermitStep1").addStyleClass("clickBorder");
				this.getView().byId("idPermitStep2").removeStyleClass("clickBorder");
				if (this.CalculateWorkCategory) {
					this.getView().byId("idWorktypeFormEdit").setVisible(false);
					// this.getView().getModel("oModel").setProperty("/jointingDate", "");
					this.getView().byId("idWorktypeFormDisplay").setVisible(true);
					this.getView().byId("idAgreementWorktypeFormDisplay").setVisible(true);
				} else {
					this.getView().byId("idWorktypeFormEdit").setVisible(true);
					this.getView().getModel("oModel").setProperty("/jointingDate", "");
					this.getView().byId("idWorktypeFormDisplay").setVisible(false);
					this.getView().byId("idAgreementWorktypeFormDisplay").setVisible(false);
				}
			} else if (oPage === "Summary") {
				this.getView().byId("idPermitp2").scrollTo(10, 100);
				this.getView().byId("idPermitNavCon").to(this.byId("idPermitp2"));
				this.getView().byId("idPermitBackBtn").setVisible(true);
				this.getView().byId("idPermitsaveAndContinue").setVisible(true);
				this.getView().byId("idSubmitPermit").setVisible(false);
				this.getView().byId("idPermitStep2").addStyleClass("clickBorder");
				this.getView().byId("idPermitStep3").removeStyleClass("clickBorder");
				if (this.permitMode === "InternalEdit") {
					this.getView().byId("idBtnSave").setVisible(true);
					this.getView().byId("idCancelBtn").setVisible(true);
					this.getView().byId("idCloseBtn").setVisible(false);
				}
			}
		},

		onPressSaveContinue: function () {
			this.onSaveAndContinue = true;
			var valid = this._onValidateFields();
			if (!valid) {
				this.getOwnerComponent().getModel("oModel").updateBindings();
				this._openmessagePopOver();
			} else {
				if (this.permitMode !== "AlterPermit" || !this.bGeometryChanged || (this.bGeometryChanged && this.bLocDescChanged)) {
					this.saveData();
					if (this.permitMode !== "AlterPermit") {
						this.Alterchange = true;
					}
				} else {
					MessageBox.warning(this.getResourceBundle().getText("alterLocationError"));
				}
			}
		},

		_navigatePage: function (oPage) {
			if (oPage === "LocationDetails" && this.onSaveAndContinue) {
				this.setLocationDetails();
				this.getView().byId("idPermitp2").scrollTo(10, 100);
				this.getView().byId("idPermitNavCon").to(this.byId("idPermitp2"));
				this.getView().byId("idPermitBackBtn").setVisible(true);
				this.getView().byId("idPermitStep2").addStyleClass("clickBorder");
				this.getView().byId("idPermitStep1").removeStyleClass("clickBorder");
			} else if (oPage === "WorkDetails" && this.onSaveAndContinue) {
				this.setWorkDetails();
				this.getView().byId("idPermitNavCon").to(this.byId("idPermitp3"));
				this.getView().byId("idPermitBackBtn").setVisible(true);
				this.getView().byId("idPermitsaveAndContinue").setVisible(false);
				this.getView().byId("idSubmitPermit").setVisible(true);
				this.getView().byId("idPermitStep3").addStyleClass("clickBorder");
				this.getView().byId("idPermitStep2").removeStyleClass("clickBorder");
				if (this.permitMode === "InternalEdit") {
					this.getView().byId("idSubmitPermit").setVisible(false);
					this.getView().byId("idBtnSave").setVisible(false);
					this.getView().byId("idCancelBtn").setVisible(false);
					this.getView().byId("idCloseBtn").setVisible(true);
				}
			}
		},

		setLocationDetails: function () {
			var model = this.getView().getModel("SummaryModel");
			var mainModel = this.getOwnerComponent().getModel("oModel");
			model.setProperty("/UKPNWorksReferenceNo", mainModel.getProperty("/UKPNWorksReferenceNumber"));
			model.setProperty("/SAPWorkOrderNo", mainModel.getProperty("/workno"));
			model.setProperty("/SAPWorkOrderOperationsNo", mainModel.getProperty("/workoperationno"));
			model.setProperty("/RoadCategories", mainModel.getProperty("/roadCategory"));
			model.setProperty("/USRN", mainModel.getProperty("/USRN"));
			model.setProperty("/WorkType", "planned");
			var isSelectedLocation = mainModel.getProperty("/LocationDescription") + "," + mainModel.getProperty("/selectedLocation");
			model.setProperty("/selectedLocation", isSelectedLocation);

			if (this.getView().byId("idPermitOperationalzone").getSelectedItem() !== null) {
				model.setProperty("/Operationalzone", this.getView().byId("idPermitOperationalzone").getSelectedItem().getText());
			}
			if (this.getView().byId("idPermitHighwayAuthBox").getSelectedItem() !== null) {
				model.setProperty("/HighwayAuthority", this.getView().byId("idPermitHighwayAuthBox").getSelectedItem().getText());
			}

			var selItems = this.getView().byId("idPermitMultiPositionofworks").getSelectedItems(),
				selPosworks = [];
			if (selItems.length !== 0) {
				for (var i in selItems) {
					selPosworks.push({
						text: selItems[i].getText()
					});
				}
			}
			model.setProperty("/PositionofWorks", selPosworks);
			model.updateBindings();
		},

		setWorkDetails: function () {
			var model = this.getView().getModel("SummaryModel");
			var mainModel = this.getOwnerComponent().getModel("oModel");

			var permitSelPath = this.getView().byId("idPermitPermitList").getSelectedContextPaths();
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
			}
			if (this.getView().byId("idPermitSecondaryContractor").getSelectedItem() !== null) {
				this.getView().getModel("SummaryModel").setProperty("/Secondarycontractor", this.getView().byId("idPermitSecondaryContractor").getSelectedItem()
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
			if (this.getView().byId("idPermitTrafficmgmttype").getSelectedItem() !== null) {
				this.getView().getModel("SummaryModel").setProperty("/Trafficmanagementtype", this.getView().byId("idPermitTrafficmgmttype").getSelectedItem()
					.getText());
			} else {
				this.getView().getModel("SummaryModel").setProperty("/Trafficmanagementtype", "");
			}
			if (this.getView().byId("idPermitFootwayClosure").getSelectedItem() !== null) {
				this.getView().getModel("SummaryModel").setProperty("/FootwayClosure", this.getView().byId("idPermitFootwayClosure").getSelectedItem()
					.getText());
			} else {
				this.getView().getModel("SummaryModel").setProperty("/FootwayClosure", "N/A");
			}
			model.setProperty("/Excavationrequired", this.getView().byId("idPermitSegmntBtnExcavation").getSelectedKey());
			if (this.getView().byId("idPermitCollaborativeWorking").getSelectedKey() === "yes") {
				if (this.getView().byId("idPermitCollabTypeBox").getSelectedItem() !== null) {
					this.getView().getModel("SummaryModel").setProperty("/Collaborationtype", this.getView().byId("idPermitCollabTypeBox").getSelectedItem()
						.getText());
				} else {
					this.getView().getModel("SummaryModel").setProperty("/Collaborationtype", "");
				}
			}
			if (this.getView().byId("idSegWRP").getSelectedKey() === "yes") {
				if (this.getView().byId("idWrpAuthorityBox").getSelectedItem() !== null) {
					this.getView().getModel("SummaryModel").setProperty("/WRPauthority", this.getView().byId("idWrpAuthorityBox").getSelectedItem()
						.getText());
				}
			} else {
				this.getView().getModel("SummaryModel").setProperty("/WRPauthority", "");
			}
			model.setProperty("/Worksdescription", mainModel.getProperty("/Worksdescription"));
			model.setProperty("/Personresponsible", mainModel.getProperty("/PersonResponsible"));
			model.setProperty("/Requestor", mainModel.getProperty("/Requestor"));
			if (this.getView().byId("idPemitworkIdentifier").getSelectedItem() !== null) {
				model.setProperty("/WorksIdentifier", this.getView().byId("idPemitworkIdentifier").getSelectedItem().getText());
			}
			if (this.getView().byId("idPermitDepartmentidentifier").getSelectedItem() !== null) {
				model.setProperty("/Departmentidentifier", this.getView().byId("idPermitDepartmentidentifier").getSelectedItem().getText());
			} else {
				model.setProperty("/Departmentidentifier", "");
			}

			model.setProperty("/Requestor", mainModel.getProperty("/Requestor"));
			model.setProperty("/Externalreference", mainModel.getProperty("/Externalreference").length === 0 ? "N/A" : mainModel.getProperty(
				"/Externalreference"));
			model.setProperty("/ProjectReference", mainModel.getProperty("/ProjectReference"));
			model.setProperty("/PersonresponsContactdetails", mainModel.getProperty("/PersonresponsContactdetails").length === 0 ? "N/A" :
				mainModel.getProperty("/PersonresponsContactdetails"));
			model.setProperty("/WorkType", "planned");
			var comments = true;
			model.getData().CommentstoHighwayAuthority.forEach(function (item) {
				if (item.commentText.trim() === mainModel.getProperty("/CommentstoHighwayAuthority").trim()) {
					comments = false;
				}
			});
			if (comments) {
				model.getData().CommentstoHighwayAuthority.push({
					commentText: mainModel.getProperty("/CommentstoHighwayAuthority"),
					commentType: "EXTERNAL"
				});
			}
			model.updateBindings();
		},

		onSelectAllDesignation: function (oEvent) {
			var sKey = oEvent.getParameter("item").getKey();
			var sIndex = sKey === "yes" ? 0 : 1;
			var list = this.getView().byId("idPermitDesignationList").getItems();
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
			var list = this.getView().byId("idPermitDesignationList").getItems();
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
				this.getView().getModel("SummaryModel").setProperty("/SpecialdesignationLength", this.getView().getModel("SummaryModel").getProperty(
					"/Specialdesignations").length);
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
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

		onPressEditWorkDetails: function () {
			this.getView().byId("idPermitp2").scrollTo(10, 100);
			this.getView().byId("idPermitsaveAndContinue").setVisible(true);
			this.getView().byId("idSubmitPermit").setVisible(false);
			this.getView().byId("idPermitStep2").addStyleClass("clickBorder");
			this.getView().byId("idPermitStep3").removeStyleClass("clickBorder");
			this.getView().byId("idPermitNavCon").to(this.byId("idPermitp2"));
		},

		onPressEditWorkLocationDetails: function () {
			this.getView().byId("idPermitp1").scrollTo(10, 100);
			this.getView().byId("idPermitBackBtn").setVisible(false);
			this.getView().byId("idPermitsaveAndContinue").setVisible(true);
			this.getView().byId("idSubmitPermit").setVisible(false);
			this.getView().byId("idPermitStep1").addStyleClass("clickBorder");
			this.getView().byId("idPermitStep3").removeStyleClass("clickBorder");
			this.getView().byId("idPermitNavCon").to(this.byId("idPermitp1"));
		},

		getWRPAuthority: function () {
			$.ajax({
				type: "GET",
				async: false,
				url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/organisations-map/?wrpFlag=true",
				contentType: "application/json",
				success: function (data) {
					this.getView().getModel("oModel").setProperty("/WrpAuthority", data);
					this.getView().getModel("oModel").updateBindings();
				}.bind(this),
				error: function (error) {
					var err = JSON.parse(error.responseText);
					MessageBox.show(err.status + " " + err.error + " " + err.message + " " + err.path, MessageBox.Icon.ERROR);
				}
			});
		},

		onselectWRPAuthority: function (evt) {
			this.getOwnerComponent().getModel("oModel").setProperty("/WRPauthorityDisplay", evt.getParameter("selectedItem").getText());
			this.removeNotification("WrpAuthority");
			evt.getSource().setValueState("None");
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		clearData: function () {
			this.sapkey = null;
			this.getOwnerComponent().setmainModel();
			this.aOldTrafficAttachments = [];
			this.aOldAttachments = [];
			this.setModel(new JSONModel([]), "AttachmentsTrafficModel");
			this.setModel(new JSONModel([]), "AttachmentsModel");
			this.getView().byId("idPermitBackBtn").setVisible(false);
			this.getView().byId("idPermitsaveAndContinue").setVisible(true);
			this.getView().byId("idSubmitPermit").setVisible(false);
			this.getView().byId("idPermitStep1").addStyleClass("clickBorder");
			this.getView().byId("idPermitStep2").removeStyleClass("clickBorder");
			this.getView().byId("idPermitStep3").removeStyleClass("clickBorder");
			this.getView().byId("idPermitNavCon").to(this.byId("idPermitp1"));
			this.getView().byId("WorkLocation").setVisible(false);
			this.getView().byId("SelectedLocationDetails").setVisible(false);
			// this.getView().byId("idProposedworkdate").setValue("");
			this.getView().byId("idPermitMultiPositionofworks").setSelectedKeys([]);
			this.getView().byId("idJointingChkbox").setSelected(false);
			this.getView().byId("idtxtJoindate").setVisible(true);
			this.getView().byId("idtxtJoindatePicker").setVisible(true);
			this.getView().byId("idtxtJoindatePicker").setValue("");
			this.getView().byId("idtxtJoindatePicker").setValueState("None");
			this.getView().byId("idTTROTTRN").setSelectedItem("none");
			this.getView().byId("idTTROTTRN").setSelectedKey("");
			this.getView().byId("idTTRNreasonlab").setVisible(false);
			this.getView().byId("idTTRNreasonBox").setVisible(false);
			this.getView().byId("idTTRNobtainedLab").setVisible(false);
			this.getView().byId("idTTRNobtainedBox").setVisible(false);
			//	this.getView().getModel("oModel").setProperty("/isTtroRequired", false);
			this.getView().byId("idTTRNobtainedBox").setSelectedItem("none");
			this.getView().byId("idTTRNobtainedBox").setSelectedKey("");
			this.getView().byId("idPermitCollaborativeWorking").setSelectedItem("none");
			this.getView().byId("CollabDetLabel").setVisible(false);
			this.getView().byId("CollabDetText").setVisible(false);
			this.getView().byId("CollabWorkLabel").setVisible(false);
			this.getView().byId("CollabWorkText").setVisible(false);
			this.getView().byId("CollabTypeLabel").setVisible(false);
			this.getView().byId("idPermitCollabTypeBox").setVisible(false);
			this.getView().byId("idPermitCollaborativeWorking").setSelectedKey("no");
			this.getView().byId("idPermitSegmntBtnExcavation").setSelectedItem("none");
			this.getView().byId("idPermitSegmntBtnExcavation").setSelectedKey("");
			this.getView().byId("idSegWRP").setSelectedItem("none");
			this.getView().byId("idEnvHealthInput").setValue("");
			this.getView().byId("idSegWRP").setSelectedKey("");
			this.getView().byId("idEnvironmentalSegBtn").setSelectedItem("none");
			this.getView().byId("idEnvironmentalSegBtn").setSelectedKey("");
			this.getView().byId("idBusStopSuspension").setSelectedItem("none");
			this.getView().byId("idBusStopSuspension").setSelectedKey("");
			this.getView().byId("idParkingSuspension").setSelectedItem("none");
			this.getView().byId("idParkingSuspension").setSelectedKey("");
			this.getView().byId("idWrpAuthorityLbl").setVisible(false);
			this.getView().byId("idWrpAuthorityBox").setVisible(false);
			this.getView().byId("idPermitp2").scrollTo(0);
			this.getView().byId("idPermitp3").scrollTo(0);
			this.getView().byId("idWorkLocSpcDesigLink").setText("Hide All");
			this.getView().byId("idWorkDetwrkTypeLink").setText("View Details");
			this.getView().byId("idWorkDetPermitcond").setText("Hide All");
			this.getView().byId("idWorktypeFormEdit").setVisible(true);
			this.getView().byId("idWorktypeFormDisplay").setVisible(false);
			this.getView().byId("idChkboxWorkPrivate").setSelected(false);
			this.getView().byId("idComboDNO").setSelectedKey("");
			this.getView().byId("idPermitOperationalzone").setSelectedKey("");
			this.getView().byId("idPermitTrafficmgmttype").setSelectedKey("");
			this.getView().byId("idTrafficmgmtcontractorBox").setSelectedKey("");
			this.getView().byId("idPermitFootwayClosure").setSelectedKey("NO");
			this.getView().byId("idOtherContractorBox").setSelectedKey("");
			this.getView().byId("idPermitDepartmentidentifier").setSelectedKey("");
			this.getView().byId("idPemitworkIdentifier").setSelectedKey("");
			this.getView().byId("idPermitSecondaryContractor").setSelectedKey("");
			this.getView().byId("idTTRNreasonBox").setSelectedKey("");
			this.getView().byId("idWrpAuthorityBox").setSelectedKey("");
			this.getView().byId("idComboActivity").setSelectedKey("");
			// this.getView().byId("idAttachTMplanLbl").setVisible(false);
			// this.getView().byId("idAttachFileBtn").setVisible(false);
			this.getView().byId("idComboActivity").setSelectedKey("");
			this.clearValidations();
			// sap.ui.getCore().byId("idDialogSegbtn").setSelectedItem("none");
			// sap.ui.getCore().byId("idDialogSegbtn").setSelectedKey("none");
			this.getView().byId("idAddedAgreemnt").setVisible(false);
			this.getView().byId("idAddAgreementLink").setText("Add Agreement");
			// this.getView().byId("idAgreementWorktypeFormDisplay").setVisible(false);
			this.getView().byId("idPersonresponsible").setValue("");
			// this.getView().byId("idProposedworkdate").setEnabled(true);
			this.getView().byId("idWorksStartDate").setEnabled(true);
			this.getView().byId("idWorksEnddate").setEnabled(true);
			this.getView().byId("idWorksStartDate").setDateValue(null);
			this.getView().byId("idWorksEnddate").setDateValue(null);
			this.getView().byId("idWorksStartDate").setValue("");
			this.getView().byId("idWorksEnddate").setValue("");
			this.getView().byId("idComboDNO").setEnabled(true);
			this.getView().byId("idPermitHighwayAuthBox").setEnabled(true);
			this.getView().byId("idPlotMap").setEnabled(true);
			this.getView().byId("idOtherContractorLbl").setVisible(false);
			this.getView().byId("idOtherContractorBox").setVisible(false);
			this.getView().byId("idOtherContractorBtn").setVisible(false);
			this.getView().byId("idAddAnotherBtn").setVisible(true);
			this.AlterapplicationID = null;
			this.alterationId = null;
			this.argumentName = null;
			this.CalculateWorkCategory = false;
			this.AgreementBtn = null;
			this.getView().byId("allDesignationSelector").setSelectedKey("");
			this.getView().byId("allDesignationSelector").setSelectedItem("none");
			//Edit enable
			this.getView().byId("idComboActivity").setEnabled(true);
			this.getView().byId("idLocDescription").setEnabled(true);
			this.getView().byId("allDesignationSelector").setEnabled(true);
			this.getView().byId("idPermitMultiPositionofworks").setEnabled(true);
			this.getView().byId("idPermitPrimaryComBox").setEnabled(true);
			this.getView().byId("idTrafficmgmtcontractorBox").setEnabled(true);
			this.getView().byId("idTTROTTRN").setEnabled(true);
			this.getView().byId("idPermitCollaborativeWorking").setEnabled(true);
			this.getView().byId("CollabDetText").setEnabled(true);
			this.getView().byId("CollabWorkText").setEnabled(true);
			this.getView().byId("idPermitCollabTypeBox").setEnabled(true);
			this.getView().byId("idPermitSegmntBtnExcavation").setEnabled(true);
			this.getView().byId("idCalculateWorkCategory").setEnabled(true);
			this.getView().byId("idEnvironmentalSegBtn").setEnabled(true);
			this.getView().byId("idEnvHealthInput").setEnabled(true);
			this.getView().byId("idEnvHealthInput").setVisible(false);
			this.getView().byId("idPermitDepartmentidentifier").setEnabled(true);
			this.getView().byId("idPemitworkIdentifier").setEnabled(true);
			this.getView().byId("idWorksDescription").setEnabled(true);
			this.getView().byId("idCommentstoHighwayAuthority").setEnabled(true);
			this.getView().byId("idPermitFootwayClosure").setEnabled(true);
			this.getView().byId("idAddAgreementLink").setEnabled(true);
			this.getView().byId("idPermitPermitList").setMode("MultiSelect");
			this.getView().byId("uploadCollection").setVisible(true);
			this.getView().byId("idBtnSave").setVisible(true);
			this.getView().byId("idTTRNreasonBox").setEnabled(true);
			this.getView().byId("idTTRNobtainedBox").setEnabled(true);
			this.getView().byId("idPermitTrafficmgmttype").setEnabled(true);
			this.getView().byId("idCloseBtn").setVisible(false);
			this.getView().byId("idCancelBtn").setVisible(true);
			this.getView().byId("idSegWRP").setEnabled(true);
			/////////enable controls
			this.getView().byId("idPermitOperationalzone").setEnabled(true);
			this.getView().byId("idChkboxWorkPrivate").setEnabled(true);
			this.getView().byId("idPermitSecondaryContractor").setEnabled(true);
			this.getView().byId("idJointingChkbox").setEnabled(true);
			this.getView().byId("idtxtJoindatePicker").setEnabled(true);
			this.getView().byId("idTrafficmgmtcontractorBox").setEnabled(true);
			this.getView().byId("idTTRNreasonBox").setEnabled(true);
			this.getView().byId("idTTRNobtainedBox").setEnabled(true);
			this.getView().byId("idParkingSuspension").setEnabled(true);
			this.getView().byId("idBusStopSuspension").setEnabled(true);
			this.getView().byId("idWrpAuthorityBox").setEnabled(true);
			this.getView().byId("idEnvHealthInput").setEnabled(true);
			this.getView().byId("idAddAnotherBtn").setEnabled(true);
			this.getView().byId("idOtherContractorBox").setEnabled(true);
			this.getView().byId("idPersonresponsible").setEnabled(true);
			this.getView().byId("idPerosnResponsibleContact").setEnabled(true);
			this.getView().byId("idIamResponsible").setEnabled(true);
			this.getView().byId("idEarlyStartLbl").setVisible(true);
			this.byId("RefNo").setEnabled(false);
			this.byId("ETONedit").setVisible(true);
			this.byId("ETONcancel").setVisible(false);
			this.byId("RefNo").setValueState("None");
			this.bEtonInDft = false;
			this.bEtonFormat = false;
			//Changes for USNR Value 
			this.getView().byId("Usrn").setEditable(true);
			//End of Changes 

		},

		onSaveEarlyAgreement: function () {
			var selectedkey = sap.ui.getCore().byId("idDialogSegbtn").getSelectedKey();
			var mainModel = this.getView().getModel("oModel");
			// this.AgreementBtn = selectedkey;
			// this.AgreemntSave = true;

			var preApprovalDetails = sap.ui.getCore().byId("idPreApprovalDetails").getValue();
			var preApprovalAuthoriser = sap.ui.getCore().byId("idPreApprovalAuthoriser").getValue();
			var earlyStart = sap.ui.getCore().byId("idEarlyStartReason").getValue();

			if (selectedkey === "yes") {
				mainModel.setProperty("/earlyStartPreApprovalFlag", true);
				if (preApprovalDetails === "" || preApprovalAuthoriser === "") {
					this.AgreemntSave = false;
					MessageBox.show("Fields are mandatory", MessageBox.Icon.ERROR);
					if (preApprovalDetails === "") {
						sap.ui.getCore().byId("idPreApprovalDetails").setValueState("Error");
						sap.ui.getCore().byId("idPreApprovalDetails").setValueStateText("Mandatory Field");
					}
					if (preApprovalAuthoriser === "") {
						sap.ui.getCore().byId("idPreApprovalAuthoriser").setValueState("Error");
						sap.ui.getCore().byId("idPreApprovalAuthoriser").setValueStateText("Mandatory Field");
					}
				} else {
					this.AgreementBtn = selectedkey;
					this.AgreemntSave = true;
					this.preApprovalDetails = preApprovalDetails;
					this.preApprovalAuthoriser = preApprovalAuthoriser;
					this.getOwnerComponent().getModel("oModel").setProperty("/earlyStartReason", "");
					this.getView().byId("idAddedAgreemnt").setVisible(true);
					this.getView().byId("idAddAgreementLink").setText("Edit Agreement");
					this.onSavePress();
					this.EarlyAgreementDialog.close();
				}
				this.removeNotification("AddAgreement");
				mainModel.setProperty("/earlyStartPreApprovalFlag", true);
			} else {
				if (earlyStart === "") {
					this.AgreemntSave = false;
					MessageBox.show("Field is mandatory", MessageBox.Icon.ERROR);
					sap.ui.getCore().byId("idEarlyStartReason").setValueState("Error");
					sap.ui.getCore().byId("idEarlyStartReason").setValueStateText("Mandatory Field");
				} else {
					this.AgreementBtn = selectedkey;
					this.AgreemntSave = true;
					this.earlyStart = earlyStart;
					this.getOwnerComponent().getModel("oModel").setProperty("/preApprovalDetails", "");
					this.getOwnerComponent().getModel("oModel").setProperty("/preApprovalAuthoriser", "");
					this.getView().byId("idAddedAgreemnt").setVisible(true);
					this.getView().byId("idAddAgreementLink").setText("Edit Agreement");
					this.onSavePress();
					this.EarlyAgreementDialog.close();
				}
				mainModel.setProperty("/earlyStartPreApprovalFlag", false);
				this.removeNotification("AddAgreement");
			}
			this.getOwnerComponent().getModel("oModel").updateBindings();
			// this.EarlyAgreementDialog.close();
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},
		onChangePreApprovalAuthoriser: function (oEvent) {
			var inputValue = oEvent.getParameter("value");
			if (inputValue.length >= 1) {
				sap.ui.getCore().byId("idPreApprovalAuthoriser").setValueState("None");
			}
		},
		onChangePreApprovalDetails: function (oEvent) {
			var inputValue = oEvent.getParameter("value");
			if (inputValue.length >= 1) {
				sap.ui.getCore().byId("idPreApprovalDetails").setValueState("None");
			}
		},
		onChangeEarlyStartReason: function (oEvent) {
			var inputValue = oEvent.getParameter("value");
			if (inputValue.length >= 1) {
				sap.ui.getCore().byId("idEarlyStartReason").setValueState("None");
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
						this.getView().getModel("SummaryModel").updateBindings();
						this.getView().getModel("oModel").updateBindings();
					}.bind(this),
					error: function (err) {

					}.bind(this)
				});
			} else {
				$.ajax({
					type: "PUT",
					url: "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + isApplicationId.applicationId + "/comments/" + isCommentId,
					contentType: "application/json",
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
						model.updateBindings();
					}.bind(this),
					error: function (err) {

					}.bind(this)
				});
			}

		},

		onSavePress: function () {
			this.onSaveAndContinue = false;
			if (this.byId("RefNo").getValueState() !== "Error" && (this.permitMode !== "AlterPermit" || !this.bGeometryChanged || (this.bGeometryChanged &&
					this.bLocDescChanged))) {
				this.saveData();
			} else {
				var sMessage = "";
				if (this.byId("RefNo").getValueState() === "Error") {
					sMessage = this.byId("RefNo").getValueStateText();
				}
				if (this.permitMode === "AlterPermit" && (this.bGeometryChanged && !this.bLocDescChanged)) {
					if (sMessage === "") {
						sMessage = this.getResourceBundle().getText("alterLocationError");
					} else {
						sMessage += "\n" + this.getResourceBundle().getText("alterLocationError");
					}
				}
				MessageBox.warning(sMessage);
			}
		},

		saveData: function () {
			var oPage = this.getView().byId("idPermitNavCon").getCurrentPage().getNavButtonTooltip();
			var isApplicationId = this.getOwnerComponent().getModel("oModel").getProperty("/isApplicationId");
			this.getCondition();
			this.onHighwayAuthority();
			this.getOwnerComponent().getModel("oModel").setProperty("/primaryContractorId", this.getView().byId("idPermitPrimaryComBox").getSelectedKey());
			var mainModel = this.getView().getModel("oModel").getProperty("/");
			var startDate = mainModel.valid_from;
			var endDate = mainModel.valid_to;
			var startJointDate = mainModel.Jointingdate;
			// var endJointDate = mainModel.Jointingdate;

			if (startDate === "") {
				startDate = null;
				endDate = null;
			} else {
				startDate = mainModel.valid_from;
				endDate = mainModel.valid_to;
			}

			var flags = {};
			var uniquepermitCond = mainModel.conditions.filter(function (entry) {
				if (flags[entry.condition]) {
					return false;
				}
				flags[entry.condition] = true;
				return true;
			});

			var payLoad = {
				workOrderNumber: mainModel.workno,
				workOrderOperationNumber: mainModel.workoperationno,
				activityType: mainModel.activityType,
				proposedStartDate: startDate,
				proposedEndDate: endDate,
				usrn: mainModel.usrn,
				roadCategory: mainModel.roadCategory,
				street: mainModel.street,
				area: mainModel.area,
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
				jointingStartDate: startJointDate,
				jointingEndDate: startJointDate,
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
				workType: "planned",
				workCategory: mainModel.workType,
				ttroReason: mainModel.ttroReason,
				ttroRequiredFlag: mainModel.isTtroRequired,
				departmentIdentifier: mainModel.departmentIdentifierId,
				worksIdentifier: mainModel.workIdentifierId,
				workDescription: mainModel.Worksdescription,
				specialDesignations: mainModel.selectedSplDesignations,
				conditions: uniquepermitCond,
				earlyStartPreApprovalFlag: mainModel.earlyStartPreApprovalFlag,
				preApprovalDetails: mainModel.preApprovalDetails,
				preApprovalAuthoriser: mainModel.preApprovalAuthoriser,
				earlyStartReason: mainModel.earlyStartReason,
				personResponsible: mainModel.PersonResponsible,
				busStopSuspensionFlag: mainModel.busStopSuspensionFlag,
				parkingSuspensionFlag: mainModel.parkingSuspensionFlag,
				agreementReferenceNumber: mainModel.AgreementReferenceNo,
				otherContractorId: mainModel.otherContractorId,
				personResponsiblePhone: mainModel.PersonresponsContactdetails,
				ttroObtained: mainModel.ttroObtained,
				workReferenceNumber: this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber") ? this.getModel("oModel").getProperty(
					"/UKPNWorksReferenceNumber") : this.getModel("oModel").getProperty("/ApplicationDetails/workReferenceNumber"),
				isAnOldPermit: mainModel.isAnOldPermit ? mainModel.isAnOldPermit : mainModel.ETONedit,
				trafficSensitiveFlag: mainModel.trafficSensitive
			};
			if (mainModel.geometry) {
				payLoad.geometry = mainModel.geometry;
			} else {
				payLoad.geometry = {
					type: "Point",
					coordinates: [296203.0, 223864.0]
				};
			}
			if (this.sapkey) {
				payLoad.sapKey = this.sapkey;
			}
			BusyIndicator.show(0);
			var oPromise;
			if (!isApplicationId && this.alterationId === null) {
				if (!this.AlterapplicationID) {
					if (!this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber") || this.getModel("oModel").getProperty(
							"/UKPNWorksReferenceNumber") === "") {
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
						this._navigatePage(oPage);
						this.alterationId = data.applicationId;
						this.byId("RefNo").setEnabled(false);
						this.byId("ETONedit").setVisible(true);
						this.byId("ETONcancel").setVisible(false);
						if (this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber")) {
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
						this.updateAttachments();
						this.byId("RefNo").setEnabled(false);
						this.byId("ETONedit").setVisible(true);
						this.byId("ETONcancel").setVisible(false);
						if (this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber")) {
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
			var oPage = this.getView().byId("idPermitNavCon").getCurrentPage().getNavButtonTooltip();
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
							this._navigatePage(oPage);
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
				this._navigatePage(oPage);
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
			var list = this.getView().byId("idPermitPermitList");
			var selPaths = this.getView().byId("idPermitPermitList").getSelectedContextPaths();
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
			this.getOwnerComponent().getModel("oModel").setProperty("/isNavigationFault", false);

			//PREPARE PRINT
			this.getView().getModel("SummaryModel").setProperty("/WorkTypevisible", true);
			this.getView().getModel("SummaryModel").setProperty("/Permitcondvisible", true);
			this.getView().getModel("SummaryModel").setProperty("/Specialdesignationvisible", true);
			this.getView().getModel("SummaryModel").setProperty("/PrintMode", true);
			this.getOwnerComponent().sPrintId = this.createId("idPermitp3") + "-cont";
			var sUrl = "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + isApplicationId.applicationId + "/submission";
			if (this.permitMode === "AlterPermit") {
				sUrl = "https://streetmanager-api.cfapps.eu10.hana.ondemand.com/api/v1/applications/" + this.AlterapplicationID + "/alterations/" + this.alterationId + "/submission";
			}
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
					this.getOwnerComponent().getModel("RegModel").setProperty("/isRegisterPermitId", isApplicationId.applicationId);
					sap.m.MessageToast.show("Records are submitted successfully");
					this.getOwnerComponent().getModel("oModel").setProperty("/isErrorLocation", false);
					this.oRouter.navTo("PermitSubmit", null, true);
				}.bind(this))
				.catch(function (oReject) {
					BusyIndicator.hide();
					this.standardAjaxErrorDisplay(oReject);
					this.getOwnerComponent().getModel("oModel").setProperty("/isErrorLocation", true);
					this.getOwnerComponent().getModel("oModel").setProperty("/isErrorFault", false);
					this.oRouter.navTo("PermitSubmit", null, true);
				}.bind(this));
		},

		onSelectPrimary: function (oEvent) {
			// if (oEvent.getParameter("selectedItem") !== null) {
			var selItem = this.getView().byId("idPermitPrimaryComBox").getSelectedKey();
			this.getOwnerComponent().getModel("oModel").setProperty("/primaryContractorId", selItem);
			this.removeNotification("PrimaryContractor");
			oEvent.getSource().setValueState("None");
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
			// }
		},

		onSelectSecondary: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/secondaryContractorId", selItem);
			}
		},
		onSelectTrafficManagementContractor: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/trafficManagementContractorContractorId", selItem);
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}

		},

		onDepartmentIdentifier: function (oEvent) {
			var selItem;
			var arr = [];
			if (oEvent.getParameter("selectedItem") !== null) {
				selItem = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/departmentIdentifierId", selItem);
				this.removeNotification("Departmentidentifier");
				oEvent.getSource().setValueState("None");
				var workidentifierData = this.getOwnerComponent().getModel("oModel").getProperty("/workIdentifier");
				workidentifierData.forEach(function (item) {
					if (item.departmentId === Number(selItem)) {
						arr.push(item);
					}
				});
			}
			this.getOwnerComponent().getModel("oModel").setProperty("/SelectedworkIdentifier", arr);
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		onWorkIdentifier: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				// var selItem = oEvent.getParameter("selectedItem").getText();
				this.getOwnerComponent().getModel("oModel").setProperty("/workIdentifierId", selItem);
				// this.getOwnerComponent().getModel("oModel").setProperty("/workIdentifier", selItem);				
				this.removeNotification("Worksidentifier");
				oEvent.getSource().setValueState("None");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
		},

		onSelectPrivateLand: function (oEvent) {
			var selected = oEvent.getParameter("selected");
			this.getOwnerComponent().getModel("oModel").setProperty("/privateLandFlag", selected);
		},

		onSelectExcavationRequired: function (oEvent) {
			var result = oEvent.getParameter("item").getText() === "Yes" ? true : false;
			this.getOwnerComponent().getModel("oModel").setProperty("/excavationRequired", result);
			this.removeNotification("Excavation Required");
			this.validSegmentedButton(this.getView().byId("idPermitSegmntBtnExcavation"), "removeStyleClass");
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},
		onSelectBusStopSuspension: function (oEvent) {
			var result = oEvent.getParameter("item").getText() === "Yes" ? true : false;
			this.getOwnerComponent().getModel("oModel").setProperty("/busStopSuspensionFlag", result);
			this.removeNotification("Bus stop suspension");
			this.validSegmentedButton(this.getView().byId("idBusStopSuspension"), "removeStyleClass");
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},
		onSelectParkingLoadingbaySuspension: function (oEvent) {
			var result = oEvent.getParameter("item").getText() === "Yes" ? true : false;
			this.getOwnerComponent().getModel("oModel").setProperty("/parkingSuspensionFlag", result);
			this.removeNotification("Parking/Loading bay suspension");
			this.validSegmentedButton(this.getView().byId("idParkingSuspension"), "removeStyleClass");
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
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
			if (this.getView().byId("idPermitHighwayAuthBox").getSelectedItem() !== null) {
				var highwayId = this.getView().byId("idPermitHighwayAuthBox").getSelectedKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/highwayId", highwayId);
			}
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
			this.validSegmentedButton(this.getView().byId("idEnvironmentalSegBtn"), "removeStyleClass");
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		onOperationZoneSelection: function (oEvent) {
			//	var selText = oEvent.getParameter("selectedItem").getText();
			if (oEvent.getParameter("selectedItem") !== null) {
				var selText = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/selectedOperationZone", selText);
				this.getView().byId("idPermitPrimaryComBox").setSelectedKey(oEvent.getParameter("selectedItem").getBindingContext("oModel").getObject()
					.defaultPrimaryContractor);
				this.getView().byId("idPermitSecondaryContractor").setSelectedKey(oEvent.getParameter("selectedItem").getBindingContext("oModel").getObject()
					.defaultSecondaryContractor);
				this.getView().getModel("oModel").setProperty("/secondaryContractorId", oEvent.getParameter("selectedItem").getBindingContext(
					"oModel").getObject().defaultSecondaryContractor);
				oEvent.getSource().setValueState("None");
				this.removeNotification("Operationalzone");
			} else {
				this.getOwnerComponent().getModel("oModel").setProperty("/primaryContractorId", "");
				this.getOwnerComponent().getModel("oModel").setProperty("/secondaryContractorId", "");
			}
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
			// if (selected) {
			// 	oEvent.getSource().setValueState("None");
			// 	this.removeNotification("Workalsoimpactprivateland");
			// }
		},

		handleUSRN: function (event) {
			if (event.getParameter("value").length !== 0) {
				// event.getSource().setValueState("None");
				// this.removeNotification("USRN");
			}
		},

		handleHighwayAuthority: function (oEvent) {
			oEvent.getSource().setValueState("None");
			this.removeNotification("HighwayAuthority");
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

		handleLiveChangeLocDescription: function (event) {
			if (event.getParameter("value").length !== 0) {
				event.getSource().setValueState("None");
				this.removeNotification("LocationDescription");
			}
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
			if (event.getParameter("value") !== this.oldLocDesc) {
				this.bLocDescChanged = true;
			} else {
				this.bLocDescChanged = false;
			}
		},

		handleLiveChangeCollabDetText: function (event) {
			if (event.getParameter("value").length !== 0) {
				event.getSource().setValueState("None");
				this.removeNotification("CollaborationDetails");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
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

		onchangeTTRNTTROReason: function (event) {
			this.getView().getModel("oModel").setProperty("/ttroReason", event.getParameter("selectedItem").getKey().toLowerCase());
			event.getSource().setValueState("None");
			this.removeNotification("TTRN/TTRO reason");
		},

		onSelectTTRNTTROobtained: function (event) {
			var key = event.getParameter("item").getKey();
			this.getView().getModel("oModel").setProperty("/ttroObtained", key === "true" ? true : false);
			this.validSegmentedButton(this.getView().byId("idTTRNobtainedBox"), "removeStyleClass");
			this.removeNotification("TTRN/TTRO obtained");
		},

		removeNotification: function (title) {
			this.getView().getModel("oModel").getData().Notifications.forEach(function (item, index, object) {
				if (item.title === title) {
					object.splice(index, 1);
				}
			}.bind(this));
			setTimeout(function () {
				this.getOwnerComponent().getModel("oModel").updateBindings();
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

		onChangePermitInput: function (evt) {
			if (evt.getParameter("value").length !== 0) {
				evt.getSource().setValueState("None");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			}
		},

		_onValidateFields: function () {
			var valid;
			if (this.getView().byId("idPermitNavCon").getCurrentPage().getNavButtonTooltip() === "LocationDetails") {
				valid = this.validateLocatonFields();
			}

			if (this.getView().byId("idPermitNavCon").getCurrentPage().getNavButtonTooltip() === "WorkDetails") {
				valid = this.validateWorkDetails();
			}
			return valid;
		},

		validateLocatonFields: function () {
			var valid = true;
			if (this.bEtonInDft) {
				valid = false;
				this.addNotification(this.getResourceBundle().getText("UKPN_Works_Reference_Number"),
					this.getResourceBundle().getText("UKPN_Works_Reference_Number") + ": " + this.getResourceBundle().getText("etonError"), true);
			}
			if (this.bEtonFormat) {
				valid = false;
				this.addNotification(this.getResourceBundle().getText("UKPN_Works_Reference_Number"),
					this.getResourceBundle().getText("UKPN_Works_Reference_Number") + ": " + this.getResourceBundle().getText("specialCharsError"),
					true);
			}
			if (this.getView().byId("idComboActivity").getSelectedItem() === null) {
				this.getView().byId("idComboActivity").setValueState("Error");
				this.addNotification("Activity", "Activity type");
				valid = false;
			}
			if (this.getView().getModel("oModel").getProperty("/Proposedworkdate").length === 0) {
				// var startDate = this.getView().byId("idWorksStartDate");
				// var endDate = this.getView().byId("idWorksEnddate");
				if (!this.getView().byId("idWorksStartDate").isValidValue() || !this.getView().byId("idWorksStartDate").getDateValue()) {
					this.getView().byId("idWorksStartDate").setValueState("Error");
					this.addNotification("ProposedWorksStartDate", "Proposed works start date");
					valid = false;
				}
				if (!this.getView().byId("idWorksEnddate").isValidValue() || !this.getView().byId("idWorksEnddate").getDateValue()) {
					this.getView().byId("idWorksEnddate").setValueState("Error");
					this.addNotification("ProposedWorksEnddate", "Proposed works end date");
					valid = false;
				}
				// this.getView().byId("idProposedworkdate").setValueState("Error");
				// this.addNotification("Proposedworkdate", "Proposed works start and end date");
				// valid = false;
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
				if (this.getView().byId("idComboDNO").getSelectedItem() === null) {
					this.getView().byId("idComboDNO").setValueState("Error");
					this.addNotification("DNO", "DNO");
					valid = false;
				}
				if (this.getView().byId("idPermitOperationalzone").getSelectedItem() === null) {
					this.getView().byId("idPermitOperationalzone").setValueState("Error");
					this.addNotification("Operationalzone", "Operational zone");
					valid = false;
				}
				if (this.getView().byId("idPermitHighwayAuthBox").getSelectedItem() === null) {
					this.getView().byId("idPermitHighwayAuthBox").setValueState("Error");
					this.addNotification("HighwayAuthority", "Highway Authority");
					valid = false;
				}
				if (this.getView().byId("idPermitMultiPositionofworks").getSelectedKeys().length === 0) {
					this.getView().byId("idPermitMultiPositionofworks").setValueState("Error");
					this.addNotification("Positionofworks", "Position of works");
					valid = false;
				}
				if (this.getView().byId("idPermitDesignationList").getItems().length !== 0) {
					if (this.Specialdesignations === false) {
						this.addNotification("Specialdesignations", "Special designations");
						valid = false;
					}
				}
				// if (!this.getView().byId("idChkboxWorkPrivate").getSelected()) {
				// 	this.getView().byId("idChkboxWorkPrivate").setValueState("Error");
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

			if (!this.getView().byId("idJointingChkbox").getSelected()) {
				if (!this.getView().getModel("oModel").getProperty("/Jointingdate")) {
					this.getView().byId("idtxtJoindatePicker").setValueState("Error");
					this.addNotification("JointingDate", "Jointing Date");
					valid = false;
				}
			}

			if (this.getView().byId("idPermitTrafficmgmttype").getSelectedItem() === null) {
				this.getView().byId("idPermitTrafficmgmttype").setValueState("Error");
				this.addNotification("TrafficManagementType", "Traffic Management Type");
				valid = false;
			}

			if (this.getView().byId("idTTROTTRN").getSelectedItem() === "none") {
				this.addNotification("TTRN/TTRO required", "TTRN/TTRO required");
				this.validSegmentedButton(this.getView().byId("idTTROTTRN"), "addStyleClass");
				valid = false;
			}

			if (this.getView().byId("idTTROTTRN").getSelectedKey().toLowerCase() === "yes".toLowerCase()) {
				if (this.getView().byId("idTTRNobtainedBox").getSelectedItem() === "none") {
					this.addNotification("TTRN/TTRO obtained", "TTRN/TTRO obtained");
					this.validSegmentedButton(this.getView().byId("idTTRNobtainedBox"), "addStyleClass");
				}

				if (this.getView().byId("idTTRNreasonBox").getSelectedItem() === null) {
					this.getView().byId("idTTRNreasonBox").setValueState("Error");
					this.addNotification("TTRN/TTRO reason", "TTRN/TTRO reason");
					valid = false;
				}
			}

			if (this.getView().byId("idPermitFootwayClosure").getSelectedItem() === null) {
				this.getView().byId("idPermitFootwayClosure").setValueState("Error");
				this.addNotification("FootwayClosure", "Footway Closure");
				valid = false;
			}

			if (this.getView().byId("idPermitCollaborativeWorking").getSelectedItem() === "none") {
				this.validSegmentedButton(this.getView().byId("idPermitCollaborativeWorking"), "addStyleClass");
				this.addNotification("Collaborative working", "Collaborative working");
				valid = false;
			}

			if (this.getView().byId("idPermitCollaborativeWorking").getSelectedKey().toLowerCase() === "yes".toLowerCase()) {
				if (this.getView().getModel("oModel").getProperty("/collaborationDetails").length === 0) {
					this.getView().byId("CollabDetText").setValueState("Error");
					this.addNotification("CollaborationDetails", "Collaboration details");
					valid = false;
				}

				if (this.getView().byId("idPermitCollabTypeBox").getSelectedItem() === null) {
					this.getView().byId("idPermitCollabTypeBox").setValueState("Error");
					this.addNotification("Collaborationtype", "Collaboration type");
					valid = false;
				}
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

			if (this.getView().byId("idPermitSegmntBtnExcavation").getSelectedItem() === "none") {
				this.addNotification("Excavation Required", "Excavation Required");
				this.validSegmentedButton(this.getView().byId("idPermitSegmntBtnExcavation"), "addStyleClass");
				valid = false;
			}

			if (this.getView().byId("idSegWRP").getSelectedItem() === "none") {
				this.validSegmentedButton(this.getView().byId("idSegWRP"), "addStyleClass");
				this.addNotification("Wrp", "WRP");
				valid = false;
			}

			if (this.getView().byId("idSegWRP").getSelectedKey().toLowerCase() === "yes".toLowerCase()) {
				if (this.getView().byId("idWrpAuthorityBox").getSelectedItem() === null) {
					this.getView().byId("idWrpAuthorityBox").setValueState("Error");
					this.addNotification("WrpAuthority", "WRP Authority");
					valid = false;
				}
			}
			if (!this.CalculateWorkCategory) {
				this.validSegmentedButton(this.getView().byId("idCalculateWorkCategory"), "addStyleClass");
				this.addNotification("CalculateWorkCategory", "Calculate work category");
				valid = false;
			}
			if (this.permitMode !== "InternalEdit") {
				if (this.getOwnerComponent().getModel("oModel").getProperty("/isEarlyStart")) {
					if (this.getView().byId("idAddAgreementLink").getText().toLowerCase() === "Add agreement".toLowerCase()) {
						this.addNotification("AddAgreement", "Add agreement");
						valid = false;
					}
				}
			}

			if (this.getView().byId("idEnvironmentalSegBtn").getSelectedItem() === "none") {
				this.validSegmentedButton(this.getView().byId("idEnvironmentalSegBtn"), "addStyleClass");
			}

			if (this.getView().byId("idEnvironmentalSegBtn").getSelectedItem() === "none") {
				this.validSegmentedButton(this.getView().byId("idEnvironmentalSegBtn"), "addStyleClass");
				this.addNotification("AreEnvironmentalHealthNotifiable", "Are Environmental Health Notifiable");
				valid = false;
			}

			if (this.getView().byId("idPermitDepartmentidentifier").getSelectedItem() === null) {
				this.getView().byId("idPermitDepartmentidentifier").setValueState("Error");
				this.addNotification("Departmentidentifier", "Department identifier");
				valid = false;
			}

			if (this.getView().byId("idPemitworkIdentifier").getSelectedItem() === null) {
				this.getView().byId("idPemitworkIdentifier").setValueState("Error");
				this.addNotification("Worksidentifier", "Works identifier");
				valid = false;
			}

			if (this.getView().getModel("oModel").getProperty("/Worksdescription").length === 0) {
				this.getView().byId("idWorksDescription").setValueState("Error");
				this.addNotification("Worksdescription", "Works description");
				valid = false;
			}

			if (!this.getView().getModel("oModel").getProperty("/Person") || this.getView().getModel("oModel").getProperty("/Person").length ===
				0) {
				this.getView().byId("idPersonresponsible").setValueState("Error");
				this.addNotification("Personresponsible", "Person responsible");
				valid = false;
			}
			if (this.getView().byId("idPermitPermitList").getSelectedItems().length !== 0) {
				valid = this.validatePermitConditions();
			}
			return valid;
		},

		validatePermitConditions: function () {
			var bValid = true;
			var list = this.getView().byId("idPermitPermitList");
			var selPaths = this.getView().byId("idPermitPermitList").getSelectedContextPaths();
			var arr = [];

			for (var i in selPaths) {
				arr.push(Number(selPaths[i].split("/")[2]));
			}

			for (var j in arr) {
				var sValue = this.getOwnerComponent().getModel("oModel").getProperty("/permitConditions/" + arr[j]).comment;
				if (!sValue || sValue.trim() === "") {
					bValid = false;
					list.getItems()[arr[j]].getContent()[0].getItems()[1].setValueState("Error");
					this.addNotification(this.getOwnerComponent().getModel("oModel").getProperty("/permitConditions/" + arr[j]).code,
						this.getOwnerComponent().getModel("oModel").getProperty("/permitConditions/" + arr[j]).code);
				} else {
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

		onPersonSelection: function (oEvent) {
			if (oEvent.getParameter("selectedRow")) {
				var selectedItem = oEvent.getParameter("selectedRow").getBindingContext("oModel").getObject().username;
				this.getView().getModel("oModel").setProperty("/PersonResponsible", selectedItem);
				var data = this.getView().getModel("oModel").getProperty("/personResponsible");
				this.getView().byId("idPersonresponsible").setValue(oEvent.getParameters("selectedRow").selectedRow.getBindingContext("oModel").getObject()
					.displayName);
				for (var i = 0; i < data.length; i++) {
					if (data[i].email === selectedItem) {
						if (data[i].telephone === "" || data[i].telephone === null) {
							this.getView().byId("idPerosnResponsibleContact").setValue("");
							this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", "");
						} else {
							this.getView().byId("idPerosnResponsibleContact").setValue(data[i].telephone);
							this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", data[i].telephone);
						}
						this.getView().getModel("oModel").setProperty("/Requestor", data[i].username);
						break;
					}
				}
				oEvent.getSource().setValueState("None");
				this.removeNotification("Personresponsible");
				if (this.permitMode === "AlterPermit") {
					this.Alterchange = true;
				}
			} else {
				oEvent.getSource().setValue("");
				this.getView().getModel("oModel").setProperty("/Person", "");
				this.getView().getModel("oModel").setProperty("/PersonResponsible", "");
				this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", "");
				this.getView().getModel("oModel").setProperty("/Requestor", "");
			}
		},

		clearValidations: function () {
			this.getView().byId("idComboActivity").setValueState("None");
			// this.getView().byId("idProposedworkdate").setValueState("None");
			this.getView().byId("idWorksStartDate").setValueState("None");
			this.getView().byId("idWorksEnddate").setValueState("None");
			this.getView().byId("Usrn").setValueState("None");
			this.getView().byId("idLocDescription").setValueState("None");
			this.getView().byId("idComboDNO").setValueState("None");
			this.getView().byId("idPermitOperationalzone").setValueState("None");
			this.getView().byId("idPermitHighwayAuthBox").setValueState("None");
			this.getView().byId("idPermitMultiPositionofworks").setValueState("None");
			this.getView().byId("idPermitPrimaryComBox").setValueState("None");
			this.getView().byId("idPermitTrafficmgmttype").setValueState("None");
			this.validSegmentedButton(this.getView().byId("idTTRNobtainedBox"), "removeStyleClass");
			this.getView().byId("idTTRNreasonBox").setValueState("None");
			this.getView().byId("idPermitFootwayClosure").setValueState("None");
			this.validSegmentedButton(this.getView().byId("idPermitCollaborativeWorking"), "removeStyleClass");
			this.getView().byId("CollabDetText").setValueState("None");
			this.getView().byId("idPermitCollabTypeBox").setValueState("None");
			this.validSegmentedButton(this.getView().byId("idPermitSegmntBtnExcavation"), "removeStyleClass");
			this.validSegmentedButton(this.getView().byId("idSegWRP"), "removeStyleClass");
			this.getView().byId("idWrpAuthorityBox").setValueState("None");
			this.validSegmentedButton(this.getView().byId("idEnvironmentalSegBtn"), "removeStyleClass");
			this.getView().byId("idPermitDepartmentidentifier").setValueState("None");
			this.getView().byId("idPemitworkIdentifier").setValueState("None");
			this.getView().byId("idPerosnResponsibleContact").setValue("");
			this.getView().byId("idWorksDescription").setValueState("None");
			this.getView().byId("idPersonresponsible").setValueState("None");
			this.validSegmentedButton(this.getView().byId("idCalculateWorkCategory"), "removeStyleClass");
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
				} else {
					this.Alterchange = true;
					if (JSON.stringify(this.oldGeometry) !== JSON.stringify(this._oMapData.geometry)) {
						this.bGeometryChanged = true;
					}
				}
			}
			if (this.getView().getModel("oModel").getData().ApplicationDetails.assessmentStatus !== undefined && this.getView().getModel(
					"oModel").getData().ApplicationDetails.assessmentStatus === "refused" && this.getView().getModel("oModel").getData().ApplicationDetails
				.assessmentStatus !== null) {
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
			//Location Details idJointingChkbox
			this.getView().byId("WorkLocation").setVisible(true);
			this.getView().byId("SelectedLocationDetails").setVisible(true);
			var mainModel = this.getView().getModel("oModel").getProperty("/");
			var data = mainModel.ApplicationDetails;
			if ((data.isAnOldPermit || !data.workStatusValue) && this.permitMode === "edit") {
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

			var propstartDate = moment(data.proposedStartDate).format('DD MMM YYYY');
			var propEndDate = moment(data.proposedEndDate).format('DD MMM YYYY');
			this._getCalculatedDays(data.proposedStartDate, data.proposedEndDate);
			this.getView().byId("idWorksStartDate").setValue(propstartDate);
			this.getView().byId("idWorksStartDate").setDateValue(new Date(data.proposedStartDate));
			this.getView().byId("idWorksEnddate").setMinDate(new Date(data.proposedStartDate));
			this.getView().byId("idWorksEnddate").setValue(propEndDate);
			this.getView().getModel("oModel").setProperty("/Proposedworkdate", propstartDate + " - " + propEndDate);
			this.getView().getModel("oModel").setProperty("/valid_from", data.proposedStartDate);
			this.getView().getModel("oModel").setProperty("/valid_to", data.proposedEndDate);
			this.getView().getModel("SummaryModel").setProperty("/Workdaterange", propstartDate + " - " + propEndDate);
			this.getModel("oModel").setProperty("/workdateRange", propstartDate + " - " + propEndDate);
			this.getView().getModel("oModel").setProperty("/activityType", data.activityType === null ? null : data.activityType.toLowerCase());
			data.activityType = data.activityType === null ? null : data.activityType.toUpperCase();
			this.getView().getModel("oModel").setProperty("/USRN", data.usrn === null ? "" : data.usrn);
			this.getView().getModel("oModel").setProperty("/Eastings", data.geometry.coordinates[0]);
			this.getView().getModel("oModel").setProperty("/Northings", data.geometry.coordinates[1]);
			this.getView().getModel("oModel").setProperty("/selectedDNO", data.dno);
			this.getView().getModel("oModel").setProperty("/selectedOperationZone", data.operationalZone);
			if (this.getView().getModel("oModel").getProperty("/allData")) {
				var resultArray = this.getView().getModel("oModel").getProperty("/allData");
				var newArray = resultArray.filter(function (param) {
					return param.dno === data.dno;
				});
				this.getView().getModel("oModel").setProperty("/operational", newArray);
			}
			this.getView().getModel("oModel").setProperty("/positionOfWorks", data.positionOfWorks);
			this.getView().getModel("oModel").setProperty("/LocationDescription", data.locationDescription === null ? "" : data.locationDescription);
			data.positionOfWorks = data.positionOfWorks === null ? null : data.positionOfWorks.toUpperCase().split(",");
			this.getView().byId("idPermitMultiPositionofworks").setSelectedKeys(data.positionOfWorks);
			this.getView().byId("idChkboxWorkPrivate").setSelected(data.privateLandFlag);
			this.getView().getModel("oModel").setProperty("/privateLandFlag", data.privateLandFlag);
			if (data.usrn !== null) {
				this.getSelectedLocation(data.usrn);
				// this.getView().byId("idPermitHighwayAuthBox").setEnabled(false);
				this.getView().getModel("oModel").setProperty("/usrn", data.usrn);
			}
			//Work Details
			if (this.permitMode !== "create") {
				this.getView().getModel("oModel").setProperty("/jointingFlag", data.jointingRequiredFlag);
				this.getView().byId("idtxtJoindatePicker").setDateValue(new Date(data.jointingStartDate ? data.jointingStartDate : ""));
				this.getView().getModel("SummaryModel").setProperty("/Jointingdate", new Date(data.jointingStartDate ? data.jointingStartDate : ""));
				this.getView().getModel("oModel").setProperty("/jointingDate", new Date(data.jointingStartDate ? data.jointingStartDate : ""));
				this.getView().getModel("oModel").setProperty("/Jointingdate", new Date(data.jointingStartDate ? data.jointingStartDate : ""));
				this.getView().byId("idJointingChkbox").setSelected(data.jointingRequiredFlag ? false : true);
				if (data.jointingRequiredFlag) {
					this.getView().getModel("oModel").setProperty("/jointingFlag", true);
					this.getView().byId("idtxtJoindatePicker").setVisible(true);
				} else {
					this.getView().byId("idtxtJoindatePicker").setVisible(false);
					this.getView().getModel("oModel").setProperty("/jointingFlag", false);
				}
			}
			this.getView().getModel("oModel").setProperty("/footwayClosureKey", data.closeFootway === null ? null : data.closeFootway.toLowerCase());
			data.closeFootway = data.closeFootway === null ? null : data.closeFootway.toUpperCase();
			// data.collaborativeWorkingFlag = data.collaborativeWorkingFlag === true ? "yes" : data.collaborativeWorkingFlag === false ? "no" :
			// 	"";
			data.collaborativeWorkingFlag = this._getTruefalseflag(data.collaborativeWorkingFlag);
			this.getView().getModel("oModel").setProperty("/trafficType", data.trafficManagementType);
			this.getView().getModel("oModel").setProperty("/trafficTypeKey", data.trafficManagementType === null ? null : data.trafficManagementType
				.toLowerCase());
			this.getView().getModel("oModel").setProperty("/ttroReason", data.ttroReason);
			this.getView().getModel("oModel").setProperty("/ttroObtained", data.ttroObtained);
			data.ttroReason = data.ttroReason === null ? null : data.ttroReason.toUpperCase();
			data.trafficManagementType = data.trafficManagementType === null ? null : data.trafficManagementType.toUpperCase();
			data.collaborationType = data.collaborationType === null ? null : data.collaborationType.toUpperCase();
			data.ttroRequiredFlag = this._getTruefalseflag(data.ttroRequiredFlag);
			this.getView().getModel("oModel").setProperty("/collaborativeWorkingType", data.collaborationType === null ? null : data.collaborationType
				.toLowerCase());
			this.getView().getModel("oModel").setProperty("/parkingSuspensionFlag", data.parkingSuspensionFlag);
			this.getView().getModel("oModel").setProperty("/busStopSuspensionFlag", data.busStopSuspensionFlag);
			data.busStopSuspensionFlag = this._getTruefalseflag(data.busStopSuspensionFlag);
			data.parkingSuspensionFlag = this._getTruefalseflag(data.parkingSuspensionFlag);
			this.getView().getModel("oModel").setProperty("/excavationRequired", data.excavationFlag);
			data.excavationFlag = this._getTruefalseflag(data.excavationFlag);
			data.wrpFlag = this._getTruefalseflag(data.wrpFlag);
			this.getView().getModel("oModel").setProperty("/environmentFlag", data.environmentalFlag ? true : false);
			if (data.environmentalFlag) {
				this.getView().byId("idEnvHealthLbl").setVisible(true);
				this.getView().byId("idEnvHealthInput").setVisible(true);
			} else {
				this.getView().byId("idEnvHealthLbl").setVisible(false);
				this.getView().byId("idEnvHealthInput").setVisible(false);
				this.getView().byId("idEnvHealthInput").setValue("");
			}
			this.getView().getModel("oModel").setProperty("/AgreementReferenceNo", data.agreementReferenceNumber);
			data.environmentalFlag = this._getTruefalseflag(data.environmentalFlag);
			this.getView().getModel("oModel").setProperty("/Collaborationworksreference", data.collaborativeWorks);
			this.getView().getModel("oModel").setProperty("/collaborationDetails", data.collaborationDetails);
			this.getView().getModel("oModel").setProperty("/preApprovalAuthoriser", data.preApprovalAuthoriser);
			this.getView().getModel("oModel").setProperty("/preApprovalDetails", data.preApprovalDetails);
			this.getView().getModel("oModel").setProperty("/earlyStartReason", data.earlyStartReason);
			this.getView().getModel("oModel").setProperty("/earlyStartPreApprovalFlag", data.earlyStartPreApprovalFlag);
			// data.selectedAgreebutton = data.earlyStartPreApprovalFlag === true ? "yes" : "no";
			if (data.earlyStartPreApprovalFlag === true) {
				data.selectedAgreebutton = "yes";
			} else if (data.earlyStartPreApprovalFlag === false) {
				data.selectedAgreebutton = "no";
			} else {
				data.selectedAgreebutton = data.earlyStartPreApprovalFlag;
			}
			if (data.preApprovalAuthoriser && data.preApprovalDetails || data.earlyStartReason) {
				this.getView().getModel("oModel").setProperty("/isEarlyStart", true);
				this.getView().byId("idAddAgreementLink").setText(this.getView().getModel("i18n").getResourceBundle().getText("EditAgreement"));
			} else {
				this.getView().byId("idAddAgreementLink").setText(this.getView().getModel("i18n").getResourceBundle().getText("AddAgreement"));
			}
			if (data.ttroRequiredFlag === "yes") {
				this.getView().byId("idTTRNreasonlab").setVisible(true);
				this.getView().byId("idTTRNreasonBox").setVisible(true);
				this.getView().byId("idTTRNobtainedLab").setVisible(true);
				this.getView().byId("idTTRNobtainedBox").setVisible(true);
				this.getView().getModel("oModel").setProperty("/isTtroRequired", true);
			} else if (data.ttroRequiredFlag === "no") {
				this.getView().byId("idTTRNreasonlab").setVisible(false);
				this.getView().byId("idTTRNreasonBox").setVisible(false);
				this.getView().byId("idTTRNobtainedLab").setVisible(false);
				this.getView().byId("idTTRNobtainedBox").setVisible(false);
				this.getView().getModel("oModel").setProperty("/isTtroRequired", false);
			} else {
				this.getView().getModel("oModel").setProperty("/isTtroRequired", data.ttroRequiredFlag);
			}
			if (data.collaborativeWorkingFlag === "yes") {
				this.getView().byId("CollabDetLabel").setVisible(true);
				this.getView().byId("CollabDetText").setVisible(true);
				this.getView().byId("CollabWorkLabel").setVisible(true);
				this.getView().byId("CollabWorkText").setVisible(true);
				this.getView().byId("CollabTypeLabel").setVisible(true);
				this.getView().byId("idPermitCollabTypeBox").setVisible(true);
				this.getView().getModel("oModel").setProperty("/collaborativeWorking", true);
			} else if (data.collaborativeWorkingFlag === "no") {
				this.getView().byId("CollabDetLabel").setVisible(false);
				this.getView().byId("CollabDetText").setVisible(false);
				this.getView().byId("CollabWorkLabel").setVisible(false);
				this.getView().byId("CollabWorkText").setVisible(false);
				this.getView().byId("CollabTypeLabel").setVisible(false);
				this.getView().byId("idPermitCollabTypeBox").setVisible(false);
				this.removeNotification("CollaborationDetails");
				this.removeNotification("Collaborationtype");
				this.getView().byId("CollabDetText").setValueState("None");
				this.getView().byId("idPermitCollabTypeBox").setValueState("None");
				this.getView().getModel("oModel").setProperty("/collaborativeWorking", false);
			} else {
				this.getView().getModel("oModel").setProperty("/collaborativeWorking", data.collaborativeWorkingFlag);
			}
			if (data.wrpFlag === "yes") {
				this.getWRPAuthority();
				this.getView().byId("idWrpAuthorityLbl").setVisible(true);
				this.getView().byId("idWrpAuthorityBox").setVisible(true);
				this.getView().getModel("SummaryModel").setProperty("/WRP", data.wrpFlag);
				this.getView().getModel("oModel").setProperty("/wrp", true);
			} else if (data.wrpFlag === "no") {
				this.getView().byId("idWrpAuthorityLbl").setVisible(false);
				this.getView().byId("idWrpAuthorityBox").setVisible(false);
				this.getView().getModel("SummaryModel").setProperty("/WRP", data.wrpFlag);
				this.getView().byId("idWrpAuthorityBox").clearSelection();
				this.getView().getModel("oModel").updateBindings();
				this.getOwnerComponent().getModel("oModel").setProperty("/WRPauthorityDisplay", "");
				this.getView().getModel("oModel").setProperty("/wrp", false);
			} else {
				this.getView().getModel("oModel").setProperty("/wrp", data.wrpFlag);
			}
			if (data.otherContractorId !== null) {
				this.onAddOtherContractor();
			}
			this.getView().getModel("oModel").setProperty("/Worksdescription", data.workDescription === null ? "" : data.workDescription);
			this.getView().byId("idPersonresponsible").setValue(data.personResponsibleDisplayText === null ? "" : data.personResponsibleDisplayText);
			this.getView().getModel("oModel").setProperty("/PersonResponsible", data.personResponsible === null ? "" : data.personResponsible);
			this.getView().getModel("oModel").setProperty("/Person", data.personResponsible === null ? "" : data.personResponsible);
			this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", data.personResponsiblePhone === null ? "" : data.personResponsiblePhone);
			this.getModel("oModel").setProperty("/LatestStartDate", data.proposedEndDate);
			this.getView().getModel("oModel").setProperty("/Requestor", data.personResponsible);

			this.getView().getModel("oModel").setProperty("/ApplicationDetails/departmentIdentifier", data.departmentIdentifier);
			this.getView().getModel("oModel").setProperty("/ApplicationDetails/worksIdentifier", data.worksIdentifier);
			this.getView().getModel("oModel").setProperty("/workIdentifierId", data.worksIdentifier);
			var workidentifierData = this.getOwnerComponent().getModel("oModel").getProperty("/workIdentifier");
			var arrIdentifier = [];
			workidentifierData.forEach(function (item) {
				if (item.departmentId === Number(data.departmentIdentifier)) {
					arrIdentifier.push(item);
				}
			});
			this.getView().getModel("oModel").setProperty("/SelectedworkIdentifier", arrIdentifier);
			// if (this.byId("idPermitDiscard").getVisible()) {
			this._getCommentstoLocalAuthority(data.applicationId);
			// }
			this._setPermitConditions(data.conditions);
			mainModel.WrpAuthority.forEach(function (item) {
				if (item.name === data.wrpAuthority) {
					data.wrpAuthorityKey = item.id;
				}
			});
			this.getView().getModel("oModel").setProperty("/trafficType", data.trafficManagementTypeValue);
			this.getView().getModel(
				"oModel").setProperty("/footwayClosure", data.closeFootwayValue);
			this.getView().getModel("oModel").setProperty("/workType",
				data.workCategory);
			this.getView().getModel("oModel").setProperty("/WRPauthorityDisplay", data.wrpAuthority);
			this.getView().getModel("oModel").setProperty(
				"/ApplicationDetails", data);
			if (this.permitMode === "AlterPermit" || this.permitMode === "create" || this.permitMode === "PAA") {
				this.getView().byId("idComboDNO").setEnabled(false);
				this.getView().byId("idPermitHighwayAuthBox").setEnabled(false);
			}
			if (this.permitMode === "edit" || this.byId("idPermitDiscard").getVisible()) {
				this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", {
					applicationId: data.applicationId,
					workId: data.workId
				});
			}
			if (this.permitMode === "AlterPermit" || this.permitMode === "PAA") {
				if (data.workCategory && data.workCategory !== "immediate_emergency" && data.workCategory !== "immediate_urgent") {
					this.getView().byId("idWorktypeFormEdit").setVisible(false);
					this.getView().byId("idWorktypeFormDisplay").setVisible(true);
					this.CalculateWorkCategory = true;
				}
			}

			if (this.permitMode === "PAA") {
				this.getView().byId("idPlotMap").setEnabled(false);
			}

			if (this.permitMode === "create") {
				if (data.workCategory && data.workCategory !== "immediate_emergency" && data.workCategory !== "immediate_urgent") {
					this.getView().byId("idWorktypeFormEdit").setVisible(false);
					this.getView().byId("idWorktypeFormDisplay").setVisible(true);
					this.CalculateWorkCategory = true;
				}
			}
			if (this.permitMode === "AlterPermit") {
				// this.getView().byId("idCommentstoHighwayAuthority").setEnabled(false);
				if (this.alterationId) {
					this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", {
						applicationId: this.AlterapplicationID,
						workId: data.workId
					});
				} else {
					this.AlterapplicationID = data.applicationId;
				}
				if (data.workStatusValue === "In Progress") {
					this.getView().byId("idWorksStartDate").setEnabled(false);
				} else {
					this.getView().byId("idWorksStartDate").setEnabled(true);
				}
			}
			if (this.permitMode === "create" && this.argumentName === "PermitReference" || this.permitMode === "create" && this.argumentName ===
				"ApplicationId") {
				if (data.workCategory && data.workCategory !== "immediate_emergency" && data.workCategory !== "immediate_urgent") {
					this.getView().byId("idWorktypeFormEdit").setVisible(false);
					this.getView().byId("idWorktypeFormDisplay").setVisible(true);
					this.CalculateWorkCategory = true;
				}
			}
			if (this.permitMode === "InternalEdit") {
				this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", {
					applicationId: data.applicationId
				});
				this._setInternalEditFields();
				if (data.workCategory && data.workCategory !== "immediate_emergency" && data.workCategory !== "immediate_urgent") {
					this.getView().byId("idWorktypeFormEdit").setVisible(false);
					this.getView().byId("idWorktypeFormDisplay").setVisible(true);
					this.CalculateWorkCategory = true;
				}
			}
			if (this.permitMode === "AlterPermit") {
				this.getView().byId("idPermitOperationalzone").setEnabled(false);
				this.getView().byId("idChkboxWorkPrivate").setEnabled(false);
				this.getView().byId("idPermitSecondaryContractor").setEnabled(false);
				this.getView().byId("idJointingChkbox").setEnabled(false);
				this.getView().byId("idtxtJoindatePicker").setEnabled(false);
				this.getView().byId("idTrafficmgmtcontractorBox").setEnabled(false);
				this.getView().byId("idParkingSuspension").setEnabled(false);
				this.getView().byId("idBusStopSuspension").setEnabled(false);
				this.getView().byId("idWrpAuthorityBox").setEnabled(false);
				this.getView().byId("idEnvHealthInput").setEnabled(false);
				this.getView().byId("idAddAnotherBtn").setEnabled(false);
				this.getView().byId("idOtherContractorBox").setEnabled(false);
				this.getView().byId("idPersonresponsible").setEnabled(false);
				this.getView().byId("idPerosnResponsibleContact").setEnabled(false);
				this.getView().byId("idIamResponsible").setEnabled(false);
			}
			if (this.permitMode === "InternalEdit" || this.permitMode === "AlterPermit") {
				this._getWorkCategory(data);
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
			var items = this.getView().byId("idPermitPermitList").getItems();
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
			var data = this.getView().getModel("oModel").getProperty("/");
			this.Specialdesignations = true;
			var model = this.getOwnerComponent().getModel("oModel");
			var list = this.getView().byId("idPermitDesignationList").getItems();
			data.ApplicationDetails.specialDesignations.forEach(function (selItem) {
				list.forEach(function (item) {
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
			this.byId("WorkLocation").setVisible(true);
			this.byId("SelectedLocationDetails").setVisible(true);
			var data = this.getOwnerComponent().getModel("SAPdataModel").getData();
			this.getModel("oModel").setProperty("/ApplicationDetails", data);
			if (data.applicationId) {
				this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", {
					applicationId: data.applicationId
				});
			}
			if (data.dno && data.dno !== "") {
				this.getView().getModel("oModel").setProperty("/selectedDNO", data.dno);
				if (this.getView().getModel("oModel").getProperty("/allData")) {
					var resultArray = this.getView().getModel("oModel").getProperty("/allData");
					var newArray = resultArray.filter(function (param) {
						return param.dno === data.dno;
					});
					this.getView().getModel("oModel").setProperty("/operational", newArray);
				}
			}
			this.getModel("oModel").setProperty("/workno", data.workOrderNo);
			this.getModel("oModel").setProperty("/workoperationno", data.workOperationNo);
			if (data.proposedStartDate && data.proposedEndDate) {
				var propstartDate = moment(data.proposedStartDate).format('DD MMM YYYY');
				var propEndDate = moment(data.proposedEndDate).format('DD MMM YYYY');
				this.getView().byId("idWorksStartDate").setValue(propstartDate);
				this.getView().byId("idWorksStartDate").setDateValue(new Date(data.proposedStartDate));
				this.getView().byId("idWorksEnddate").setMinDate(new Date(data.proposedStartDate));
				this.getView().byId("idWorksEnddate").setValue(propEndDate);
				this.getModel("oModel").setProperty("/workdateRange", propstartDate + " - " + propEndDate);
				this.getModel("oModel").setProperty("/Proposedworkdate", propstartDate + " - " + propEndDate);
				this.getModel("oModel").setProperty("/valid_from", data.proposedStartDate);
				this.getModel("oModel").setProperty("/valid_to", data.proposedEndDate);
				this._getCalculatedDays(data.proposedStartDate, data.proposedEndDate);
				this.getModel("oModel").setProperty("/Workdaterange", propstartDate + " - " + propEndDate);
			}
			this.byId("idtxtJoindatePicker").setDateValue(new Date(data.jointingStartDate === null ? "" : data.jointingStartDate));
			this.getModel("oModel").setProperty("/Eastings", data.easting);
			this.getModel("oModel").setProperty("/Northings", data.northing);
			if (data.usrn && data.usrn !== "") {
				this.getSelectedLocation(data.usrn);
				this.getModel("oModel").setProperty("/usrn", data.usrn);
			}
			BusyIndicator.hide();
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
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
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
			this.getView().byId("idPersonresponsible").setValue(userData.displayName);
			this.getView().getModel("oModel").setProperty("/Requestor", userData.email);
			if (userData.telephone === "" || userData.telephone === null) {
				this.getView().byId("idPerosnResponsibleContact").setValue("");
				this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", "");
			} else {
				this.getView().byId("idPerosnResponsibleContact").setValue(userData.telephone);
				this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", userData.telephone);
			}
			this.getView().byId("idPersonresponsible").setValueState("None");
			this.removeNotification("Personresponsible");
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		_setInternalEditFields: function () {
			this.getView().byId("idPermitOperationalzone").setEnabled(true);
			this.getView().byId("idChkboxWorkPrivate").setEnabled(true);
			this.getView().byId("idPermitSecondaryContractor").setEnabled(true);
			this.getView().byId("idtxtJoindatePicker").setEnabled(true);
			this.getView().byId("idJointingChkbox").setEnabled(true);
			this.getView().byId("idTrafficmgmtcontractorBox").setEnabled(true);
			this.getView().byId("idParkingSuspension").setEnabled(true);
			this.getView().byId("idBusStopSuspension").setEnabled(true);
			this.getView().byId("idSegWRP").setEnabled(false);
			if (this.getView().getModel("oModel").getData().ApplicationDetails.wrpFlag === "yes") {
				this.getView().byId("idWrpAuthorityBox").setEnabled(true);
			} else {
				this.getView().byId("idWrpAuthorityBox").setEnabled(false);
			}
			this.getView().byId("idWrpAuthorityBox").setEnabled(true);
			this.getView().byId("idAddAnotherBtn").setEnabled(true);
			this.getView().byId("idOtherContractorBox").setEnabled(true);
			this.getView().byId("idOtherContractorBtn").setEnabled(true);
			this.getView().byId("idPersonresponsible").setEnabled(true);
			this.getView().byId("idPerosnResponsibleContact").setEnabled(true);
			//Disable location details
			this.getView().byId("idComboActivity").setEnabled(false);
			this.getView().byId("idWorksStartDate").setEnabled(false);
			this.getView().byId("idWorksEnddate").setEnabled(false);
			this.getView().byId("idPlotMap").setEnabled(false);
			this.getView().byId("idLocDescription").setEnabled(false);
			this.getView().byId("idComboDNO").setEnabled(false);
			this.getView().byId("idPermitHighwayAuthBox").setEnabled(false);
			this.getView().byId("allDesignationSelector").setEnabled(false);
			this.getView().byId("idPermitMultiPositionofworks").setEnabled(false);
			//Disable Work details
			this.getView().byId("idPermitPrimaryComBox").setEnabled(false);
			this.getView().byId("idPermitTrafficmgmttype").setEnabled(false);
			this.getView().byId("idTTROTTRN").setEnabled(false);
			if (this.getView().getModel("oModel").getData().ApplicationDetails.ttroRequiredFlag === "yes") {
				this.getView().byId("idTTRNobtainedBox").setEnabled(true);
				this.getView().byId("idTTRNreasonBox").setEnabled(true);
			} else {
				this.getView().byId("idTTRNobtainedBox").setEnabled(false);
				this.getView().byId("idTTRNreasonBox").setEnabled(false);
			}

			// this.getView().byId("idTTRNobtainedBox").setEnabled(false);
			this.getView().byId("idPermitFootwayClosure").setEnabled(false);
			this.getView().byId("idPermitCollaborativeWorking").setEnabled(false);
			this.getView().byId("CollabDetText").setEnabled(false);
			this.getView().byId("CollabWorkText").setEnabled(false);
			this.getView().byId("idPermitCollabTypeBox").setEnabled(false);
			this.getView().byId("idPermitSegmntBtnExcavation").setEnabled(false);
			this.getView().byId("idEnvironmentalSegBtn").setEnabled(false);
			if (this.getView().getModel("oModel").getData().ApplicationDetails.environmentalFlag === "yes") {
				this.getView().byId("idEnvHealthLbl").setVisible(true);
				this.getView().byId("idEnvHealthInput").setVisible(true);
				this.getView().byId("idEnvHealthInput").setEnabled(true);
			} else {
				this.getView().byId("idEnvHealthLbl").setVisible(false);
				this.getView().byId("idEnvHealthInput").setVisible(false);
				this.getView().byId("idEnvHealthInput").setEnabled(false);
			}

			// this.getView().byId("idCalculateWorkCategory").setEnabled(false);
			this.getView().byId("idPermitDepartmentidentifier").setEnabled(false);
			this.getView().byId("idPemitworkIdentifier").setEnabled(false);
			this.getView().byId("idWorksDescription").setEnabled(false);
			this.getView().byId("idCommentstoHighwayAuthority").setEnabled(false);
			this.getView().byId("idPermitDesignationList").getItems().forEach(function (item) {
				item.getCells()[8].setEnabled(false);
			});
			this.getView().byId("idAddAgreementLink").setEnabled(false);
			this.getView().byId("idPermitPermitList").setMode("None");
			this.getView().byId("uploadCollection").setVisible(false);
			this.getView().byId("idEarlyStartLbl").setVisible(false);
			this.getView().byId("idAgreementWorktypeFormDisplay").setVisible(false);
			//Code change to set USNr Disable  by Amdhan Team 
			if (this.getView().getModel("oModel").getData().ApplicationDetails.assessmentStatus !== undefined && this.getView().getModel(
					"oModel").getData().ApplicationDetails.assessmentStatus == "refused" && this.getView().getModel("oModel").getData().ApplicationDetails
				.assessmentStatus != null) {
				this.getView().byId("Usrn").setEditable(false);

			} else {
				this.getView().byId("Usrn").setEditable(true);

			}
			//End Of Code Changes 
		},

		_getLocationAgreement: function () {
			var address;
			var isStreet = this.getView().getModel("oModel").getProperty("/street");
			var isArea = this.getView().getModel("oModel").getProperty("/area");
			var isTown = this.getView().getModel("oModel").getProperty("/town");

			if (!isArea) {
				address = isStreet + ", " + isTown;
			} else if (!isStreet) {
				address = isArea + ",  " + isTown;
			} else if (!isTown) {
				address = isStreet + ", " + isArea;
			} else {
				address = isStreet + ", " + isArea + ", " + isTown;
			}
			this.getView().getModel("oModel").setProperty("/LocationAgreement", address);
		},

		handlePerosnResponsibleContact: function () {
			if (this.permitMode === "AlterPermit") {
				this.Alterchange = true;
			}
		},

		_getWorkCategory: function (sdata) {
			BusyIndicator.show(0);
			var isTtroRequired;
			var sTrafficSensitive = this.getView().getModel("oModel").getProperty("/trafficSensitive");
			if (sdata.ttroRequiredFlag === "yes") {
				isTtroRequired = true;
			} else {
				isTtroRequired = false;
			}
			var oData = {
				workType: "PLANNED",
				isTtroRequired: isTtroRequired,
				proposedStartDate: new Date(new Date(sdata.proposedStartDate).toString().split("GMT")[0] + " UTC").toISOString().split(".")[0],
				proposedEndDate: new Date(new Date(sdata.proposedEndDate).toString().split("GMT")[0] + " UTC").toISOString().split(".")[0],
				roadCategory: sdata.roadCategory,
				trafficSensitive: sTrafficSensitive
			};
			var oCreatePromise = ApiFacade.getInstance().WorkCategory(oData);
			oCreatePromise.then(function (data) {
					this.getView().getModel("oModel").setProperty("/SlidingStatic", data.sliding_static);
					BusyIndicator.hide();
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		onETONedit: function () {
			this.sOldEton = this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber");
			this.byId("RefNo").setEnabled(true);
			this.byId("ETONedit").setVisible(false);
			this.byId("ETONcancel").setVisible(true);
		},

		onETONcancel: function () {
			this.getModel("oModel").setProperty("/UKPNWorksReferenceNumber", this.sOldEton);
			this.byId("RefNo").setEnabled(false);
			this.byId("ETONedit").setVisible(true);
			this.byId("ETONcancel").setVisible(false);
			this.byId("RefNo").setValueState("None");
			this.bEtonInDft = false;
			this.bEtonFormat = false;
			this.removeNotification(this.getResourceBundle().getText("UKPN_Works_Reference_Number"));
		},

		checkETON: function () {
			var regex = /^[a-zA-Z0-9]*$/;
			if (this.getModel("oModel").getProperty("/UKPNWorksReferenceNumber").search(regex) !== 0) {
				this.bEtonFormat = true;
				this.byId("RefNo").setValueState("Error");
				this.byId("RefNo").setValueStateText(this.getResourceBundle().getText("specialCharsError"));
			} else {
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
							if (oReject.error.status !== 404) {
								this.standardAjaxErrorDisplay(oReject);
							} else {
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