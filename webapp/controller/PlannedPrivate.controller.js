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

	return BaseController.extend("project1.controller.PlannedPrivate", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf SAP.UKPN.UI.PermitApplication.view.PlannedPrivate
		 */
		formatter: Formatter,
		Specialdesignations: false,
		onSaveAndContinue: false,
		permitMode: "",
		AlterapplicationID: null,
		alterationId: null,
		draftAlterationId: null,
		argumentName: null,
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("PlannedPrivate").attachPatternMatched(this.onRoutemacth, this);
		},

		onRoutemacth: function (evt) {
			this.draftAlterationId = null;
				//This Condition is used when the Permit status is refused
			if (this.getView().getModel("ExtendPermitModel").oData.data != undefined && this.getView().getModel("ExtendPermitModel").oData.data.status !== undefined && this.getView().getModel("ExtendPermitModel").oData
				.data.status !== null) {
				this.PermitStatus = this.getView().getModel("ExtendPermitModel").oData.data.status;
			} else {
				this.PermitStatus = "";
			}
			//**********End of the Changes *****************************************
			this.alterationId = null;
			this.AlterapplicationID = null;
			// this.byId("idPermitDiscard").setVisible(false);
			this.getView().getModel("oModel").setProperty("/isErrorLocation", false);
			this.getView().getModel("oModel").setProperty("/isNavigationFault", false);
			this.clearData();
			this.setDevicewidth();
			this._getInitialData();
			this._getSpecialDesignationData();
			this.createSummaryModel();
			this.getView().getModel("oModel").setProperty("/workType", "PRIVATE_PLANNED");
			this.permitMode = evt.getParameter("arguments").mode;

			if (this.permitMode === "create") {
				if (evt.getParameter("arguments").NAME1 === "PermitReference" || evt.getParameter("arguments").NAME1 === "ApplicationId") {
					this.argumentName = evt.getParameter("arguments").NAME1;
					this.getApplicationDetails(evt.getParameter("arguments").PARAM1);
				} else if (evt.getParameter("arguments").NAME1 === "sapkey") {
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
					if(!this.formatter.checkDevUrl(this.getResourceBundle().getText("environment"))){
						this.doNavTo("RouteHome");
					}
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

			if (this.permitMode === "edit" || this.permitMode === "InternalEdit") {
				if (evt.getParameter("arguments").NAME1 === "ApplicationId") {
					this.getApplicationDetails(evt.getParameter("arguments").PARAM1);
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
				CommentstoHighwayAuthority: "N/A",
				designations: [],
				Externalreference: "N/A",
				ProjectReference: "",
				PersonresponsContactdetails: "N/A",
				PrintMode: false,
				LicenceAuthority: "",
				Licencenumber: "",
				AuthorityContactTxt: "",
				requestId: ""
			};
			var oModel = new JSONModel(data);
			this.getView().setModel(oModel, "SummaryModel");
		},

		//Contractors - Primary, Secondary, Traffic Management and Others
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
		//Traffic Management
		getTrafficManagement: function () {
			var oPromise = ApiFacade.getInstance().getTrafficManagement();
			oPromise.then(function (data) {
				this.getView().getModel("oModel").setProperty("/trafficManagementType", data);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},
		//Operational Zone
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
		//Collaboration Type
		getCollaborationType: function () {
			var oPromise = ApiFacade.getInstance().getCollaborationType();
			oPromise.then(function (data) {
				this.getView().getModel("oModel").setProperty("/collaborationType", data);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},
		//Location Type
		getLocationType: function () {
			var oPromise = ApiFacade.getInstance().getLocationType();
			oPromise.then(function (data) {
				this.getView().getModel("oModel").setProperty("/locationType", data);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
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
						this.getView().byId("idPermitHighwayAuthBox").setEnabled(true);
					} else {
						this.getView().byId("idPermitHighwayAuthBox").setSelectedItem(this.getView().byId("idPermitHighwayAuthBox").getItems()[0]);
						this.getView().byId("idPermitHighwayAuthBox").setEnabled(false);
						// this.getView().getModel("oModel").setProperty("/ApplicationDetails/wrpAuthorityKey", odata.primaryNoticeAuthorities[0].swaCode);
						// this.getView().getModel("oModel").setProperty("/ApplicationDetails/LicenceAuthority", odata.primaryNoticeAuthorities[0].swaCode);
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
						// this.getView().byId("specailDesignation").setVisible(false);
						// this.getView().byId("allDesignationSelector").setVisible(false);
					} else {
						odata.additionalSpecialDesignations.forEach(function (oDesignation) {
							if (oDesignation.street_special_desig_code === 16) {
								this.getView().getModel("oModel").setProperty("/LaneRentalFlag", true);
							}
						}.bind(this));
						// this.getView().byId("specailDesignation").setVisible(true);
						this.getView().byId("idPermitDesignationList").setVisible(true);
						// this.getView().byId("allDesignationSelector").setVisible(true);
					}
					this.getView().getModel("oModel").setProperty("/SelectedLocation", odata);
					this.getView().getModel("oModel").refresh(true);
					// if (this.getView().getModel("oModel").getData().ApplicationDetails.length !== 0) {
					// 	this._setSpecialDesignations();
					// }
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

		getActivity: function () {
			var oPromise = ApiFacade.getInstance().getActivity();
			oPromise.then(function (oData) {
				this.getView().getModel("oModel").setProperty("/activities", oData);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
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
				this.getView().getModel("oModel").setProperty("/workIdentifier", data);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},

		getDepartmentIdentifier: function () {
			var oPromise = ApiFacade.getInstance().getDepartmentIdentifier();
			oPromise.then(function (data) {
				this.getView().getModel("oModel").setProperty("/departmentIdentifier", data);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
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

		onFootwayClosure: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var result = oEvent.getParameter("selectedItem");
				this.getView().getModel("oModel").setProperty("/footwayClosure", result.getText());
				this.getView().getModel("oModel").setProperty("/footwayClosureKey", result.getKey().toLowerCase());
				this.removeNotification("FootwayClosure");
				oEvent.getSource().setValueState("None");
			}
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
		},

		OnSearchLocation: function () {
			this.OnSearchMap();
			this.getView().byId("SelectedLocationDetails").setVisible(true);
		},

		onSummaryStep: function () {
			this.getView().byId("saveAndContinue").setVisible(false);
			this.getView().byId("submitPermit").setVisible(true);
		},

		onSelectDNO: function (evt) {
			var resultArray = this.getView().getModel("oModel").getProperty("/allData");
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
			var SelectedWrpAuthority = [];
			this.getView().getModel("oModel").getData().WrpAuthority.forEach(function (item) {
				if (evt.getSource().getSelectedItem().getText() === item.dno) {
					SelectedWrpAuthority.push(item);
				}
			}.bind(this));
			this.getView().getModel("oModel").setProperty("/SelectedWrpAuthority", SelectedWrpAuthority);
			this.getView().getModel("oModel").refresh(true);
		},

		onSubmitPermit: function () {
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
		},

		onWRP: function (oEvent) {
			var result = oEvent.getParameter("item").getText();
			this.getView().getModel("oModel").setProperty("/wrp", result === "Yes" ? true : false);
			this.validSegmentedButton(this.getView().byId("idSegWRP"), "removeStyleClass");
			this.removeNotification("Wrp");
			if (result === "Yes") {
				this.getView().byId("idWrpAuthorityLbl").setVisible(true);
				this.getView().byId("idWrpAuthorityBox").setVisible(true);
				this.getView().getModel("oModel").setProperty("/ApplicationDetails/wrpAuthorityKey", this.getView().byId("idPermitHighwayAuthBox")
					.getSelectedKey());
				this.getView().getModel("oModel").setProperty("/WRPauthorityDisplay", this.getView().byId("idWrpAuthorityBox")
					.getSelectedItem().getText());
				this.getView().getModel("SummaryModel").setProperty("/WRP", result);
			} else {
				this.getView().byId("idWrpAuthorityLbl").setVisible(false);
				this.getView().byId("idWrpAuthorityBox").setVisible(false);
				this.getView().getModel("SummaryModel").setProperty("/WRP", result);
				this.getView().byId("idWrpAuthorityBox").clearSelection();
				this.getView().byId("idWrpAuthorityBox").setValueState("None");
				this.getOwnerComponent().getModel("oModel").setProperty("/WRPauthorityDisplay", "");
				this.getView().getModel("oModel").refresh(true);
			}
		},

		onAuthoritylicenceworks: function (oEvent) {
			var result = oEvent.getParameter("item").getText();
			this.removeNotification("Authoritylicenceworks");
			this.validSegmentedButton(this.getView().byId("idSegAuthoritylicenceworks"), "removeStyleClass");
			if (result === "Yes") {
				this.getView().getModel("oModel").setProperty("/authoritylicenceworksVisible", true);
				this.getView().getModel("oModel").setProperty("/ApplicationDetails/LicenceAuthority", this.getView().byId("idPermitHighwayAuthBox")
					.getSelectedKey());
				this.getView().getModel("oModel").setProperty("/LicenceAuthority", this.getView().byId("idLicenceAuthority")
					.getSelectedItem().getText());
			} else {
				this.getView().getModel("oModel").setProperty("/authoritylicenceworksVisible", false);
				this.getView().getModel("oModel").setProperty("/Licencenumber", "");
				this.getView().getModel("oModel").setProperty("/LicenceAuthority", "");
				this.getView().getModel("oModel").setProperty("/sendEmailtoAuthority", false);
				this.getOwnerComponent().getModel("oModel").setProperty("/highwayAuthorityContactId", "");
				this.getView().getModel("SummaryModel").setProperty("/AuthorityContactTxt", "");
				this.getView().byId("idLabelAuthorityContact").setVisible(false);
				this.getView().byId("idBoxAuthorityContact").setVisible(false);
			}
			this.getView().getModel("oModel").refresh(true);
		},

		onsendEmailtoAuthority: function (evt) {
			if (evt.getSource().getSelected()) {
				this.getView().getModel("oModel").setProperty("/sendEmailtoAuthority", true);
				this.getAuthorityContact();
			} else {
				this.getView().getModel("oModel").setProperty("/AuthorityContact", []);
				this.getView().getModel("oModel").setProperty("/sendEmailtoAuthority", false);
				this.getView().byId("idLabelAuthorityContact").setVisible(false);
				this.getView().byId("idBoxAuthorityContact").setVisible(false);
			}
		},

		getAuthorityContact: function () {
			BusyIndicator.show(0);
			var oCreatePromise = ApiFacade.getInstance().getAuthorityContact(this.getView().byId("idPermitHighwayAuthBox").getSelectedKey());
			oCreatePromise.then(function (data) {
					BusyIndicator.hide();
					this.getView().byId("idLabelAuthorityContact").setVisible(true);
					this.getView().byId("idBoxAuthorityContact").setVisible(true);
					this.getView().getModel("oModel").setProperty("/AuthorityContact", data);
					this.getView().getModel("oModel").refresh(true);
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		handleAuthorityContact: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				oEvent.getSource().setValueState("None");
				this.removeNotification("AuthorityContact");
				this.getOwnerComponent().getModel("oModel").setProperty("/highwayAuthorityContactId", oEvent.getParameter("selectedItem").getKey());
				this.getView().getModel("SummaryModel").setProperty("/AuthorityContactTxt", oEvent.getParameter("selectedItem").getText());
			} else {
				this.getOwnerComponent().getModel("oModel").setProperty("/highwayAuthorityContactId", "");
			}
		},

		handleChangeJointDate: function (oEvent) {
			var result = oEvent.getParameter("value");
			if (result.length !== 0) {
				this.getView().getModel("oModel").setProperty("/jointingFlag", true);
				this.getView().getModel("oModel").setProperty("/jointingDate", oEvent.getSource().getDateValue());
				this.getView().getModel("oModel").setProperty("/Jointingdate", new Date(oEvent.getSource().getDateValue()));
				this.getView().getModel("SummaryModel").setProperty("/Jointingdate", new Date(oEvent.getSource().getDateValue()));
				this.getView().byId("idtxtJoindatePicker").setValueState("None");
				this.removeNotification("JointingDate");
			}
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

		onSelectOtherContractor: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/otherContractorId", selItem);
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
			this.getView().getModel("oModel").refresh(true);
			this.getView().byId("idOtherContractorBox").clearSelection();
			this.getView().getModel("oModel").setProperty("/otherContractorId", "");
			this.getView().getModel("SummaryModel").setProperty("/Othercontractor", "N/A");
		},

		onBackNav: function (evt) {
			this.onSavePress();
			var oPage = this.getView().byId("idPermitNavCon").getCurrentPage().getNavButtonTooltip();
			if (oPage === "WorkDetails") {
				this.getView().byId("idPermitp1").scrollTo(10, 100);
				this.getView().byId("idPermitNavCon").to(this.byId("idPermitp1"));
				this.getView().byId("idPermitBackBtn").setVisible(false);
				this.getView().getModel("oModel").setProperty("/jointingDate", "");
				this.getView().byId("idPermitStep1").addStyleClass("clickBorder");
				this.getView().byId("idPermitStep2").removeStyleClass("clickBorder");
				if (this.permitMode !== "AlterPermit") {
					this.getView().byId("idLabelAuthorityContact").setVisible(false);
					this.getView().byId("idBoxAuthorityContact").setVisible(false);
					this.getView().byId("idCheckBocAuthorityContact").setSelected(false);
					this.getView().getModel("oModel").setProperty("/AuthorityContact", []);
				}
			} else if (oPage === "Summary") {
				this.getView().byId("idPermitp2").scrollTo(10, 100);
				this.getView().byId("idPermitNavCon").to(this.byId("idPermitp2"));
				this.getView().byId("idPermitBackBtn").setVisible(true);
				this.getView().byId("idPermitsaveAndContinue").setVisible(true);
				this.getView().byId("idSubmitPermit").setVisible(false);
				this.getView().byId("idSavePermit").setVisible(false);
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
				this.getOwnerComponent().getModel("oModel").refresh(true);
				this._openmessagePopOver();
			} else {
				this.saveData();
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
				this.getView().byId("idPermitStep3").addStyleClass("clickBorder");
				this.getView().byId("idPermitStep2").removeStyleClass("clickBorder");
				if (this.permitMode === "AlterPermit") {
					this.getView().byId("idSavePermit").setVisible(true);
				} else {
					this.getView().byId("idSubmitPermit").setVisible(true);
				}
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
			// model.setProperty("/selectedLocation", mainModel.getProperty("/selectedLocation"));
			model.setProperty("/WorkType", "PRIVATE_PLANNED");
			model.setProperty("/requestId", mainModel.getProperty("/requestId"));

			//Begin - Exact location with selected location for summary - CR MVP2 - UKPN-2786
			var isSelectedLocation = mainModel.getProperty("/LocationDescription") + "," + mainModel.getProperty("/selectedLocation");
			model.setProperty("/selectedLocation", isSelectedLocation);
			//End - Exact location with selected location for summary - CR MVP2 - UKPN-2786

			if (this.getView().byId("idPermitOperationalzone").getSelectedItem() !== null) {
				model.setProperty("/Operationalzone", this.getView().byId("idPermitOperationalzone").getSelectedItem().getText());
			}
			if (this.getView().byId("idPermitHighwayAuthBox").getSelectedItem() !== null) {
				model.setProperty("/HighwayAuthority", this.getView().byId("idPermitHighwayAuthBox").getSelectedItem().getText());
			}
			model.refresh(true);
		},

		setWorkDetails: function () {
			var model = this.getView().getModel("SummaryModel");
			var mainModel = this.getOwnerComponent().getModel("oModel");

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
			if (this.getView().byId("idPermitFootwayClosure").getSelectedItem() !== null) {
				this.getView().getModel("SummaryModel").setProperty("/FootwayClosure", this.getView().byId("idPermitFootwayClosure").getSelectedItem()
					.getText());
			} else {
				this.getView().getModel("SummaryModel").setProperty("/FootwayClosure", "N/A");
			}
			model.setProperty("/Excavationrequired", this.getView().byId("idPermitSegmntBtnExcavation").getSelectedKey());

			if (this.getView().byId("idSegWRP").getSelectedKey() === "yes") {
				if (this.getView().byId("idWrpAuthorityBox").getSelectedItem() !== null) {
					this.getView().getModel("SummaryModel").setProperty("/WRPauthority", this.getView().byId("idWrpAuthorityBox").getSelectedItem()
						.getText());
				}
			} else {
				this.getView().getModel("SummaryModel").setProperty("/WRPauthority", "");
			}

			if (this.getView().byId("idSegAuthoritylicenceworks").getSelectedKey() === "yes") {
				if (this.getView().byId("idLicenceAuthority").getSelectedItem() !== null) {
					this.getView().getModel("SummaryModel").setProperty("/LicenceAuthority", this.getView().byId("idLicenceAuthority").getSelectedItem()
						.getText());
					this.getView().getModel("SummaryModel").setProperty("/Licencenumber", this.getView().getModel("oModel").getProperty(
						"/Licencenumber"));
					if (this.getView().byId("idCheckBocAuthorityContact").getSelected()) {
						this.getView().getModel("SummaryModel").setProperty("/AuthorityContactTxt", this.getView().byId("idBoxAuthorityContact").getSelectedItem()
							.getText());
					} else {
						this.getView().getModel("SummaryModel").setProperty("/AuthorityContactTxt", "");
					}
				}
			} else {
				this.getView().getModel("SummaryModel").setProperty("/LicenceAuthority", "");
				this.getView().getModel("SummaryModel").setProperty("/Licencenumber", "");
				this.getView().getModel("SummaryModel").setProperty("/AuthorityContactTxt", "");
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
			model.setProperty("/PersonresponsContactdetails", mainModel.getProperty("/PersonresponsContactdetails").length === 0 ? "N/A" :
				mainModel.getProperty("/PersonresponsContactdetails"));
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
			// this.byId("specailDesignation").setVisible(false);
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
			var oPromise = ApiFacade.getInstance().getWRPflag();
			oPromise.then(function (data) {
				this.getView().getModel("oModel").setProperty("/WrpAuthority", data);
				this.getView().getModel("oModel").refresh(true);
			}.bind(this));
			return oPromise;
		},

		onselectWRPAuthority: function (evt) {
			this.getOwnerComponent().getModel("oModel").setProperty("/WRPauthorityDisplay", evt.getParameter("selectedItem").getText());
			this.removeNotification("WrpAuthority");
			evt.getSource().setValueState("None");
		},

		clearData: function () {
			this.sapkey = null;
			this.getOwnerComponent().setmainModel();
			this.getView().byId("idPermitBackBtn").setVisible(false);
			this.getView().byId("idPermitsaveAndContinue").setVisible(true);
			this.getView().byId("idSubmitPermit").setVisible(false);
			this.getView().byId("idSavePermit").setVisible(false);
			this.getView().byId("idPermitStep1").addStyleClass("clickBorder");
			this.getView().byId("idPermitStep2").removeStyleClass("clickBorder");
			this.getView().byId("idPermitStep3").removeStyleClass("clickBorder");
			this.getView().byId("idPermitNavCon").to(this.byId("idPermitp1"));
			this.getView().byId("WorkLocation").setVisible(false);
			this.getView().byId("SelectedLocationDetails").setVisible(false);
			this.getView().byId("idJointingChkbox").setSelected(false);
			this.getView().byId("idJointingChkbox").setVisible(true);
			this.getView().byId("idtxtJoindate").setVisible(true);
			this.getView().byId("idtxtJoindatePicker").setVisible(true);
			this.getView().byId("idtxtJoindatePicker").setValue("");
			this.getView().byId("idPermitSegmntBtnExcavation").setSelectedItem("none");
			this.getView().byId("idPermitSegmntBtnExcavation").setSelectedKey("");
			this.getView().byId("idSegWRP").setSelectedItem("none");
			this.getView().byId("idSegWRP").setSelectedKey("");
			this.getView().byId("idSegAuthoritylicenceworks").setSelectedItem("none");
			this.getView().byId("idSegAuthoritylicenceworks").setSelectedKey("");
			this.getView().byId("idWrpAuthorityLbl").setVisible(false);
			this.getView().byId("idWrpAuthorityBox").setVisible(false);
			this.getView().byId("idWorkDetwrkTypeLink").setText("View Details");
			this.getView().byId("idComboDNO").setSelectedKey("");
			this.getView().byId("idPermitOperationalzone").setSelectedKey("");
			this.getView().byId("idPermitFootwayClosure").setSelectedKey("NO");
			this.getView().byId("idOtherContractorBox").setSelectedKey("");
			this.getView().byId("idPermitDepartmentidentifier").setSelectedKey("");
			this.getView().byId("idPemitworkIdentifier").setSelectedKey("");
			this.getView().byId("idPermitSecondaryContractor").setSelectedKey("");
			this.getView().byId("idWrpAuthorityBox").setSelectedKey("");
			this.getView().byId("idComboActivity").setSelectedKey("");
			this.getView().byId("idComboActivity").setSelectedKey("");
			this.clearValidations();
			this.getView().byId("idPersonresponsible").setValue("");
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
			//Edit enable
			this.getView().byId("idComboActivity").setEnabled(true);
			this.getView().byId("idLocDescription").setEnabled(true);
			this.getView().byId("idPermitPrimaryComBox").setEnabled(true);
			this.getView().byId("idPermitSegmntBtnExcavation").setEnabled(true);
			this.getView().byId("idPermitDepartmentidentifier").setEnabled(true);
			this.getView().byId("idPemitworkIdentifier").setEnabled(true);
			this.getView().byId("idWorksDescription").setEnabled(true);
			this.getView().byId("idPermitFootwayClosure").setEnabled(true);
			this.getView().byId("idBtnSave").setVisible(true);
			this.getView().byId("idCloseBtn").setVisible(false);
			this.getView().byId("idCancelBtn").setVisible(true);
			this.getView().byId("idLabelAuthorityContact").setVisible(false);
			this.getView().byId("idBoxAuthorityContact").setVisible(false);
			this.getView().byId("idCheckBocAuthorityContact").setSelected(false);
			this.getView().getModel("oModel").setProperty("/AuthorityContact", []);
			this.getView().byId("idSegAuthoritylicenceworks").setEnabled(true);
			this.getView().byId("idLicencenumber").setEnabled(true);
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

					}.bind(this),
					error: function (err) {

					}.bind(this)
				});
			}

		},

		onSavePress: function () {
			this.onSaveAndContinue = false;
			this.saveData();
		},

		saveData: function () {
			var oPage = this.getView().byId("idPermitNavCon").getCurrentPage().getNavButtonTooltip();
			var isApplicationId = this.getOwnerComponent().getModel("oModel").getProperty("/isApplicationId");
			// this.getCondition();
			this.onHighwayAuthority();
			this.getOwnerComponent().getModel("oModel").setProperty("/primaryContractorId", this.getView().byId("idPermitPrimaryComBox").getSelectedKey());
			var mainModel = this.getView().getModel("oModel").getProperty("/");
			var startDate = mainModel.valid_from;
			var endDate = mainModel.valid_to;
			var startJointDate = mainModel.Jointingdate;

			if (startDate === "") {
				startDate = null;
				endDate = null;
			} else {
				startDate = mainModel.valid_from;
				endDate = mainModel.valid_to;
			}

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
				primaryContractorId: mainModel.primaryContractorId,
				secondaryContractorId: mainModel.ApplicationDetails.secondaryContractorId,
				jointingRequiredFlag: mainModel.jointingFlag,
				jointingStartDate: startJointDate,
				jointingEndDate: startJointDate,
				closeFootway: mainModel.footwayClosureKey,
				excavationFlag: mainModel.excavationRequired,
				wrpAuthority: mainModel.WRPauthorityDisplay,
				wrpFlag: mainModel.wrp,
				licenseAuthority: mainModel.LicenceAuthority,
				licenseNumber: mainModel.Licencenumber,
				workType: mainModel.workType,
				highwayAuthorityContactId: mainModel.highwayAuthorityContactId,
				departmentIdentifier: mainModel.departmentIdentifierId,
				worksIdentifier: mainModel.workIdentifierId,
				workDescription: mainModel.Worksdescription,
				personResponsible: mainModel.PersonResponsible,
				otherContractorId: mainModel.otherContractorId,
				personResponsiblePhone: mainModel.PersonresponsContactdetails,
				emailToAuthority: mainModel.sendEmailtoAuthority,
				workReferenceNumber: this.getView().getModel("oModel").getProperty("/ApplicationDetails/workReferenceNumber"),
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
						this.getView().getModel("oModel").setProperty("/requestId", data.workId);
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
						BusyIndicator.hide();
						this._navigatePage(oPage);
						sap.m.MessageToast.show("Records are saved successfully");
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

		onDeleteItemPress: function (oEvent) {
			oEvent.getSource().destroy();
		},

		onSubmission: function () {
			var isApplicationId = this.getOwnerComponent().getModel("oModel").getProperty("/isApplicationId");
			this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", isApplicationId.workId);
			this.getOwnerComponent().getModel("oModel").setProperty("/isNavigationFault", false);
			this.getView().getModel("oModel").setProperty("/isPrivatePlanned", true);
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
					var message = "Permit " + data.permitReferenceNumber + " Saved";
					if (this.getOwnerComponent().getModel("oModel").getProperty("/workType") === "PRIVATE_PLANNED") {
						message = "Permit " + data.permitReferenceNumber + " Saved";
					}
					if (this.permitMode === "AlterPermit") {
						message = "Permit " + data.permitAlterationReferenceNumber + " Saved";
					}
					this.getView().getModel("SummaryModel").setProperty("/PermitReferenceNo", data.permit_alteration_reference_number ? data.permit_alteration_reference_number :
						data.permitReferenceNumber);
					this.getView().getModel("SummaryModel").setProperty("/UKPNWorksReferenceNo", data.workReferenceNumber);
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
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = this.getView().byId("idPermitPrimaryComBox").getSelectedKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/primaryContractorId", selItem);
				this.removeNotification("PrimaryContractor");
				oEvent.getSource().setValueState("None");
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
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/trafficManagementContractorContractorId", selItem);
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
		},

		onWorkIdentifier: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/workIdentifierId", selItem);
				this.removeNotification("Worksidentifier");
				oEvent.getSource().setValueState("None");
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
		},

		onActivityType: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/activityType", selItem.toLowerCase());
				oEvent.getSource().setValueState("None");
				this.removeNotification("Activity");
			}
		},

		onCollaborationType: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var result = oEvent.getParameter("selectedItem").getKey();
				this.getOwnerComponent().getModel("oModel").setProperty("/collaborativeWorkingType", result.toLowerCase());
				this.removeNotification("Collaborationtype");
				oEvent.getSource().setValueState("None");
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
		},

		onOperationZoneSelection: function (oEvent) {
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
		},

		onSelectworkPrivateLand: function (oEvent) {
			var selected = oEvent.getParameter("selected");
			this.getOwnerComponent().getModel("oModel").setProperty("/privateLandFlag", selected);
		},

		handleUSRN: function (event) {
			if (event.getParameter("value").length !== 0) {
				// event.getSource().setValueState("None");
				// this.removeNotification("USRN");
			}
		},

		handleHighwayAuthority: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				oEvent.getSource().setValueState("None");
				this.getOwnerComponent().getModel("oModel").setProperty("/highwayId", oEvent.getSource().getSelectedKey());
				this.removeNotification("HighwayAuthority");
				this.getView().getModel("oModel").setProperty("/ApplicationDetails/wrpAuthorityKey", oEvent.getSource().getSelectedKey());
			} else {
				this.getOwnerComponent().getModel("oModel").setProperty("/highwayId", "");
				this.getView().getModel("oModel").setProperty("/ApplicationDetails/wrpAuthorityKey", "");
			}
		},

		handleLicenceAuthority: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				oEvent.getSource().setValueState("None");
				this.getOwnerComponent().getModel("oModel").setProperty("/licenseAuthority", oEvent.getSource().getSelectedText());
				this.removeNotification("HighwayAuthority");
				this.getView().getModel("oModel").setProperty("/ApplicationDetails/LicenceAuthority", oEvent.getSource().getSelectedKey());
			} else {
				this.getOwnerComponent().getModel("oModel").setProperty("/highwayId", "");
				this.getView().getModel("oModel").setProperty("/LicenceAuthority", "");
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

		handleLiveChangeLocDescription: function (event) {
			if (event.getParameter("value").length !== 0) {
				event.getSource().setValueState("None");
				this.removeNotification("LocationDescription");
			}
		},

		handleLiveChangeWorksdescription: function (event) {
			if (event.getParameter("value").length !== 0) {
				event.getSource().setValueState("None");
				this.removeNotification("Worksdescription");
			}
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

		addNotification: function (title, desc) {
			this.removeNotification(title);
			this.getView().getModel("oModel").getData().Notifications.push({
				description: desc + " is a required field",
				type: sap.ui.core.MessageType.Error,
				title: title
			});
		},

		onChangePermitInput: function (evt) {
			if (evt.getParameter("value").length !== 0) {
				evt.getSource().setValueState("None");
			}
		},

		handlechangeLicencenumber: function (evt) {
			if (evt.getParameter("value").length !== 0) {
				evt.getSource().setValueState("None");
				this.removeNotification("Licencenumber");
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
			if (this.getView().byId("idComboActivity").getSelectedItem() === null) {
				this.getView().byId("idComboActivity").setValueState("Error");
				this.addNotification("Activity", "Activity type");
				valid = false;
			}
			if (this.getView().getModel("oModel").getProperty("/Proposedworkdate").length === 0) {
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
			}
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
				if (this.getView().byId("idtxtJoindatePicker").getDateValue() === null || this.getView().byId("idtxtJoindatePicker").getValue().length ===
					0) {
					this.getView().byId("idtxtJoindatePicker").setValueState("Error");
					this.addNotification("JointingDate", "Jointing Date");
					valid = false;
				}
			}

			if (this.getView().byId("idPermitFootwayClosure").getSelectedItem() === null) {
				this.getView().byId("idPermitFootwayClosure").setValueState("Error");
				this.addNotification("FootwayClosure", "Footway Closure");
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

			if (this.getView().byId("idSegAuthoritylicenceworks").getSelectedItem() === "none") {
				this.validSegmentedButton(this.getView().byId("idSegAuthoritylicenceworks"), "addStyleClass");
				this.addNotification("Authoritylicenceworks", "Authority licenceworks");
				valid = false;
			}

			if (this.getView().getModel("oModel").getProperty("/ApplicationDetails/Authoritylicenceworks") === "yes") {
				if (this.getView().byId("idLicenceAuthority").getSelectedItem() === null) {
					this.getView().byId("idLicenceAuthority").setValueState("Error");
					this.addNotification("Licenceauthority", "Licence authority");
					valid = false;
				}

				if (this.getView().getModel("oModel").getProperty("/Licencenumber").length === 0) {
					this.getView().byId("idLicencenumber").setValueState("Error");
					this.addNotification("Licencenumber", "Licence number");
					valid = false;
				}
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

			if (this.getView().byId("idCheckBocAuthorityContact").getSelected()) {
				if (this.getView().byId("idBoxAuthorityContact").getSelectedItem() === null) {
					this.getView().byId("idBoxAuthorityContact").setValueState("Error");
					this.addNotification("AuthorityContact", "Authority contact");
					valid = false;
				}
			}

			return valid;
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
			if(oEvent.getParameter("selectedRow")){
				var selectedItem = oEvent.getParameters("selectedRow").selectedRow.getBindingContext("oModel").getObject().username;
				this.getView().getModel("oModel").setProperty("/PersonResponsible", selectedItem);
				this.getView().byId("idPersonresponsible").setValue(oEvent.getParameters("selectedRow").selectedRow.getBindingContext("oModel").getObject()
					.displayName);
				var data = this.getView().getModel("oModel").getProperty("/personResponsible");
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
			}else{
				oEvent.getSource().setValue("");
				this.getView().getModel("oModel").setProperty("/Person","");
				this.getView().getModel("oModel").setProperty("/PersonResponsible", "");
				this.getView().getModel("oModel").setProperty("/PersonresponsContactdetails", "");
				this.getView().getModel("oModel").setProperty("/Requestor","");
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
			this.getView().byId("idPermitPrimaryComBox").setValueState("None");
			this.getView().byId("idPermitFootwayClosure").setValueState("None");
			this.validSegmentedButton(this.getView().byId("idPermitSegmntBtnExcavation"), "removeStyleClass");
			this.validSegmentedButton(this.getView().byId("idSegWRP"), "removeStyleClass");
			this.validSegmentedButton(this.getView().byId("idSegAuthoritylicenceworks"), "removeStyleClass");
			this.getView().byId("idWrpAuthorityBox").setValueState("None");
			this.getView().byId("idPermitDepartmentidentifier").setValueState("None");
			this.getView().byId("idPemitworkIdentifier").setValueState("None");
			this.getView().byId("idPerosnResponsibleContact").setValue("");
			this.getView().byId("idWorksDescription").setValueState("None");
			this.getView().byId("idPersonresponsible").setValueState("None");
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
			// val = val === true ? "yes" : val === false ? "no" : "";
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

		_getInitialData: function () {
			BusyIndicator.show();
			var aPromises = [];
			aPromises.push(this.getContractorAll());
			aPromises.push(this.getTrafficManagement());
			aPromises.push(this.getOperationalZone());
			aPromises.push(this.getCollaborationType());
			aPromises.push(this.getLocationType());
			aPromises.push(this.getActivity());
			aPromises.push(this.getFootwayClosure());
			aPromises.push(this.getWorkIdentifier());
			aPromises.push(this.getDepartmentIdentifier());
			aPromises.push(this.getWRPAuthority());

			Promise.all(aPromises).then(function (aData) {
					BusyIndicator.hide();
				}.bind(this))
				.catch(function (oReject) {
					BusyIndicator.hide();
					this.standardAjaxErrorDisplay(oReject);
				}.bind(this));
		},

		_setPrePopulateDta: function () {
			//Location Details
			this.getView().byId("WorkLocation").setVisible(true);
			this.getView().byId("SelectedLocationDetails").setVisible(true);
			var mainModel = this.getView().getModel("oModel").getProperty("/");
			var data = mainModel.ApplicationDetails;
			this.getView().getModel("oModel").setProperty("/workno", data.workOrderNumber);
			this.getView().getModel("oModel").setProperty("/requestId", data.workId);
			this.getView().getModel("oModel").setProperty("/UKPNWorksReferenceNumber", data.workReferenceNumber);
			this.getView().getModel("oModel").setProperty("/workoperationno", data.workOrderOperationNumber);
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
			this.interval = setInterval(function () {
				if (this.getView().getModel("oModel").getProperty("/allData")) {
					var resultArray = this.getView().getModel("oModel").getProperty("/allData");
					var newArray = resultArray.filter(function (param) {
						return param.dno === data.dno;
					});
					this.getView().getModel("oModel").setProperty("/operational", newArray);
					clearInterval(this.interval);
				}
			}.bind(this), 1000);
			var SelectedWrpAuthority = [];
			mainModel.WrpAuthority.forEach(function (item) {
				if (data.dno === item.dno) {
					SelectedWrpAuthority.push(item);
				}
			}.bind(this));
			this.getView().getModel("oModel").setProperty("/SelectedWrpAuthority", SelectedWrpAuthority);
			this.getView().getModel("oModel").refresh(true);
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
			if (data.usrn !== null) {
				this.getSelectedLocation(data.usrn);
				this.getView().getModel("oModel").setProperty("/usrn", data.usrn);
			}
			//Work Details idJointingChkbox
			this.getView().getModel("oModel").setProperty("/footwayClosureKey", data.closeFootway === null ? null : data.closeFootway.toLowerCase());
			data.closeFootway = data.closeFootway === null ? null : data.closeFootway.toUpperCase();
			this.getView().byId("idJointingChkbox").setSelected(data.jointingRequiredFlag ? false : true);
			if (data.jointingRequiredFlag) {
				this.getView().byId("idtxtJoindatePicker").setVisible(true);
			} else {
				this.getView().byId("idtxtJoindatePicker").setVisible(false);
			}
			this.getView().getModel("oModel").setProperty("/jointingFlag", data.jointingRequiredFlag);
			this.getView().byId("idtxtJoindatePicker").setDateValue(new Date(data.jointingStartDate === null ? "" : data.jointingStartDate));
			this.getView().getModel("SummaryModel").setProperty("/Jointingdate", new Date(data.jointingStartDate === null ? "" : data.jointingStartDate));
			this.getView().getModel("oModel").setProperty("/jointingDate", new Date(data.jointingStartDate === null ? "" : data.jointingStartDate));
			this.getView().getModel("oModel").setProperty("/Jointingdate", new Date(data.jointingStartDate === null ? "" : data.jointingStartDate));

			this.getView().getModel("oModel").setProperty("/excavationRequired", data.excavationFlag);
			data.excavationFlag = this._getTruefalseflag(data.excavationFlag);
			data.wrpFlag = this._getTruefalseflag(data.wrpFlag);
			if (data.wrpFlag === "yes") {
				// this.getWRPAuthority();
				this.getView().byId("idWrpAuthorityLbl").setVisible(true);
				this.getView().byId("idWrpAuthorityBox").setVisible(true);
				this.getView().getModel("SummaryModel").setProperty("/WRP", data.wrpFlag);
				this.getView().getModel("oModel").setProperty("/WRPauthorityDisplay", data.wrpAuthority);

				mainModel.SelectedWrpAuthority.forEach(function (item) {
					if (item.name === data.wrpAuthority) {
						data.wrpAuthorityKey = item.swaOrgRef;
					}
				});

				this.getView().getModel("oModel").setProperty("/wrp", true);
				this.getView().getModel("SummaryModel").setProperty("/WRP", "Yes");
			} else if (data.wrpFlag === "no") {
				this.getView().byId("idWrpAuthorityLbl").setVisible(false);
				this.getView().byId("idWrpAuthorityBox").setVisible(false);
				this.getView().getModel("SummaryModel").setProperty("/WRP", data.wrpFlag);
				this.getView().byId("idWrpAuthorityBox").clearSelection();
				this.getView().getModel("oModel").refresh(true);
				this.getOwnerComponent().getModel("oModel").setProperty("/WRPauthorityDisplay", "");
				this.getView().getModel("oModel").setProperty("/wrp", false);
			} else {
				this.getView().getModel("oModel").setProperty("/wrp", data.wrpFlag);
			}

			if (data.highwayAuthorityContactId) {
				this.getView().getModel("oModel").setProperty("/highwayAuthorityContactId", data.highwayAuthorityContactId);
				this.getView().byId("idCheckBocAuthorityContact").setSelected(true);
				this.getAuthorityContact();
			}

			// Authority works
			if (data.licenseNumber) {
				this.getView().byId("idSegAuthoritylicenceworks").setSelectedKey("yes");
				this.getView().getModel("oModel").setProperty("/Licencenumber", data.licenseNumber);
				this.getView().getModel("oModel").setProperty("/authoritylicenceworksVisible", true);
				this.getView().getModel("oModel").setProperty("/ApplicationDetails/LicenceAuthority", this.getView().byId("idPermitHighwayAuthBox")
					.getSelectedKey());
				this.getView().getModel("oModel").setProperty("/LicenceAuthority", this.getView().byId("idLicenceAuthority")
					.getSelectedItem().getText());
			} else {
				this.getView().byId("idSegAuthoritylicenceworks").setSelectedKey("no");
				this.getView().getModel("oModel").setProperty("/authoritylicenceworksVisible", false);
				this.getView().getModel("oModel").setProperty("/Licencenumber", "");
				this.getView().getModel("oModel").setProperty("/LicenceAuthority", "");
				this.getView().getModel("oModel").setProperty("/sendEmailtoAuthority", false);
				this.getOwnerComponent().getModel("oModel").setProperty("/highwayAuthorityContactId", "");
				this.getView().getModel("SummaryModel").setProperty("/AuthorityContactTxt", "");
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
			this.getView().getModel("oModel").setProperty("/departmentIdentifierId", data.departmentIdentifier);
			this.getView().getModel("oModel").setProperty("/footwayClosure", data.closeFootwayValue);
			this.getView().getModel("oModel").setProperty("/WRPauthorityDisplay", data.wrpAuthority);
			this.getView().getModel("oModel").setProperty("/ApplicationDetails", data);
			var workidentifierData = this.getOwnerComponent().getModel("oModel").getProperty("/workIdentifier");
			var arrIdentifier = [];
			workidentifierData.forEach(function (item) {
				if (item.departmentId === Number(data.departmentIdentifier)) {
					arrIdentifier.push(item);
				}
			});
			this.getView().getModel("oModel").setProperty("/SelectedworkIdentifier", arrIdentifier);
			if (this.permitMode === "AlterPermit") {
				this.getView().byId("idSegAuthoritylicenceworks").setEnabled(false);
				this.getView().byId("idLicencenumber").setEnabled(false);
				if (this.alterationId) {
					this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", {
						applicationId: this.AlterapplicationID,
						workId: data.workId
					});
				} else {
					this.AlterapplicationID = data.applicationId;
				}
			}
			if (this.permitMode === "edit") {
				this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", {
					applicationId: data.applicationId,
					workId: data.workId
				});
			}
			if (this.permitMode === "InternalEdit") {
				this.getView().byId("idPlotMap").setEnabled(false);
				this.getOwnerComponent().getModel("oModel").setProperty("/isApplicationId", {
					applicationId: data.applicationId
				});
				this.getView().byId("idSegAuthoritylicenceworks").setEnabled(false);
				this.getView().byId("idLicencenumber").setEnabled(false);
			}
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
				this.interval = setInterval(function () {
					if (this.getView().getModel("oModel").getProperty("/allData")) {
						var resultArray = this.getView().getModel("oModel").getProperty("/allData");
						var newArray = resultArray.filter(function (param) {
							return param.dno === data.dno;
						});
						this.getView().getModel("oModel").setProperty("/operational", newArray);
						clearInterval(this.interval);
					}
				}.bind(this), 1000);
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
			// Authority works
			if (data.licenseNumber) {
				this.getView().byId("idSegAuthoritylicenceworks").setSelectedKey("yes");
				this.getView().getModel("oModel").setProperty("/Licencenumber", data.licenseNumber);
				this.getView().getModel("oModel").setProperty("/authoritylicenceworksVisible", true);
				this.getView().getModel("oModel").setProperty("/ApplicationDetails/LicenceAuthority", this.getView().byId("idPermitHighwayAuthBox")
					.getSelectedKey());
			} else {
				this.getView().byId("idSegAuthoritylicenceworks").setSelectedKey("no");
				this.getView().getModel("oModel").setProperty("/authoritylicenceworksVisible", false);
				this.getView().getModel("oModel").setProperty("/Licencenumber", "");
				this.getView().getModel("oModel").setProperty("/LicenceAuthority", "");
				this.getView().getModel("oModel").setProperty("/sendEmailtoAuthority", false);
				this.getView().getModel("oModel").setProperty("/highwayAuthorityContactId", "");
				this.getView().getModel("SummaryModel").setProperty("/AuthorityContactTxt", "");
			}
			BusyIndicator.hide();
		}
	});
});