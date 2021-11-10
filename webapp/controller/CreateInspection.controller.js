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

	return BaseController.extend("project1.controller.CreateInspection", {
		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf SAP.UKPN.UI.PermitApplication.view.CreateInspection
		 */
		RelatedPermitNumber: false,
		addWorksComments: null,
		SaveWorkComment: false,
		editmode: false,
		inspectionID:null,
		aTypesCat: null,
		onInit: function () {
			this.oRouter = this.getOwnerComponent().getRouter();
			this.oRouter.getRoute("CreateInspection").attachPatternMatched(this.onRoutemacth, this);
		},

		onRoutemacth: function (oEvent) {
			this._getTypesMapping();
			this._getWorkTypes();
			if (oEvent.getParameter("arguments").state === "id") {
				this.editmode = false;
				this.inspectionID = null;
				this._createModel();
				this._getInspectionTypes();
				this._getInspectionCategory();
				this._getInspectionOutcomes();
				this._getInspectionCoordinator();
				this._getWorkingGroup();
				this.clearData();
			} else {
				this.editmode = true;
				this.inspectionID = oEvent.getParameter("arguments").state;	
			}
		},

		clearData: function () {
			this.getView().byId("idInput").setValue("");
			this.getView().getModel("CreateInsModel").setProperty("/workingGroup", "");
			this.getView().byId("idCheckBox").setSelected(false);
			this.getView().byId("idInspectionDateTime").setMaxDate(new Date());
			this.getView().byId("idInspectionDateTime").setInitialFocusedDateValue(new Date());
			var aFiles = this.getView().byId("IdCreateInspectionupload").getItems();
			aFiles.forEach(function (oFile) {
				oFile.destroy();
			});
			this.getView().byId("IdCreateInspectionupload").destroyItems();
			this.getView().byId("idInspectionCoordinator").setSelectedItem(null);
			this.getView().byId("idInspectionType").setSelectedItem(null);
			this.getView().byId("idInspectionCategory").setSelectedItem(null);
			this.getView().byId("idInspectionOutcome").setSelectedItem(null);
			this.SaveWorkComment = false;
		},

		onSaveandSendDetails: function (bFlag) {
			var createInsModel = this.getView().getModel("CreateInsModel").getProperty("/");
			// var workingGroup = this.getView().byId("idInput").getValue();
			var inspectionCoordinator = this.getView().byId("idInspectionCoordinator").getSelectedKey();
			var payload = {
				permitReferenceNumber: createInsModel.permitNumber,
				section81: createInsModel.section81,
				workingGroup: Number(this.getView().getModel("CreateInsModel").getProperty("/workingGroup")),
				inspectionCoordinator: inspectionCoordinator,
				internalId: createInsModel.internalId,
				inspectionDateTime: createInsModel.inspectionDateTime,
				inspectorName: createInsModel.inspectorName,
				type: createInsModel.inspectiontype,
				category: createInsModel.inspectioncategory,
				outcome: createInsModel.Inspectionoutcome,
				dueDate: createInsModel.dueDate,
				comments: createInsModel.comments
			};
			var valid = this._validateFields();
			if (valid) {
				if (this.editmode === false) {
					BusyIndicator.show(0);
				var oCreatePromise = ApiFacade.getInstance().CreateInspection(payload);
				oCreatePromise.then(function (data) {
						this._CreateInspectionWorkComment();
						this.updateAttachments(data);
					}.bind(this))
					.catch(
						function (oReject) {
							BusyIndicator.hide();
							this.standardAjaxErrorDisplay(oReject);
						}.bind(this)
					);
					
				} else {
						BusyIndicator.show(0);
				var oCreatePromise2 = ApiFacade.getInstance().UpdateInspection(payload,this.inspectionID,bFlag);
				oCreatePromise2.then(function (data) {
						this._CreateInspectionWorkComment();
						this.updateAttachments(data);
					}.bind(this))
					.catch(
						function (oReject) {
							BusyIndicator.hide();
							this.standardAjaxErrorDisplay(oReject);
						}.bind(this)
					);
					
				}
				
			} else {
				MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("please_fill_the_mandatory_field"));
			}
		},

		onAddWorkComment: function (oEvent) {
			if (!this.addWorksComments) {
				this.addWorksComments = sap.ui.xmlfragment("SAP.UKPN.UI.PermitApplication.view.Fragment.AddCommentCreateInspection", this);
				this.getView().addDependent(this.addWorksComments);
			}
			this.addWorksComments.open();
		},

		onSaveWorkComment: function (oEvent) {
			MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("comment_saved_successfully"));
			this.SaveWorkComment = true;
			// var payload = {
			// 	content: this.getView().getModel("CreateInsModel").getProperty("/CreateInspectionWorkComment"),
			// 	type: "EXTERNAL"
			// };
			// var applicationId = this.getView().getModel("CreateInsModel").getProperty("/permitNumber");
			// var oCreatePromise = ApiFacade.getInstance().CreateInspectionComment(applicationId, payload);
			// oCreatePromise.then(function (data) {
			// 		MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("comment_saved_successfully"));
			// 	}.bind(this))
			// 	.catch(
			// 		function (oReject) {
			// 			var errorMessage = oReject.error.responseText;
			// 			if (typeof errorMessage !== "string") {
			// 				errorMessage = errorMessage.message;
			// 			}
			// 			MessageBox.warning(errorMessage);
			// 		}.bind(this)
			// 	);
			// sap.ui.getCore().byId("idWorkComment").setValue("");
			this.addWorksComments.close();
		},

		_CreateInspectionWorkComment: function () {
			if (this.SaveWorkComment) {
				var payload = {
					content: this.getView().getModel("CreateInsModel").getProperty("/CreateInspectionWorkComment"),
					type: "EXTERNAL"
				};
				var applicationId = this.getView().getModel("CreateInsModel").getProperty("/permitNumber");
				var oCreatePromise = ApiFacade.getInstance().CreateInspectionComment(applicationId, payload);
				oCreatePromise.then(function (data) {
						MessageToast.show(this.getView().getModel("i18n").getResourceBundle().getText("comment_saved_successfully"));
					}.bind(this))
					.catch(
						function (oReject) {
							this.standardAjaxErrorDisplay(oReject);
						}.bind(this)
					);
				sap.ui.getCore().byId("idWorkComment").setValue("");
			}
		},

		onPressCancelWorkComment: function (oEvent) {
			this.addWorksComments.close();
		},

		onSelectInspectionType: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getView().getModel("CreateInsModel").setProperty("/inspectiontype", selItem);
				oEvent.getSource().setValueState("None");
				var aCategory = [];
				this._aCategory.forEach(function(oCategory){
					if(this.aTypesCat[selItem] && this.aTypesCat[selItem][oCategory.key]){
						aCategory.push(oCategory);
					}
				}.bind(this));
				this.getView().getModel("CreateInsModel").setProperty("/category", aCategory);
			}
			this.getDueDateCalculation();
		},

		onSelectInspectionCategory: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getView().getModel("CreateInsModel").setProperty("/inspectioncategory", selItem);
				oEvent.getSource().setValueState("None");
			}
			this.getDueDateCalculation();
		},

		onSelectInspectionOutcome: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getView().getModel("CreateInsModel").setProperty("/Inspectionoutcome", selItem);
				oEvent.getSource().setValueState("None");
			}
			this.getDueDateCalculation();
		},

		onSelectInspectionDate: function (oEvent) {
			if (oEvent.getSource().getDateValue() !== null) {
				var InspectionDateTime = new Date(oEvent.getSource().getDateValue());
				this.getView().getModel("CreateInsModel").setProperty("/inspectionDateTime", InspectionDateTime.toISOString());
				oEvent.getSource().setValueState("None");
			}
		},

		onSelectDueDate: function (oEvent) {
			if (oEvent.getSource().getDateValue() !== null) {
				var dueDateTime = new Date(oEvent.getSource().getDateValue());
				this.getView().getModel("CreateInsModel").setProperty("/dueDate", dueDateTime.toISOString());
				oEvent.getSource().setValueState("None");
			}

		},

		onChangePermitNumber: function (oEvent) {
			// var inputValue = oEvent.getParameter("value");
			// if (inputValue.length >= 1) {
			// 	oEvent.getSource().setValueState("None");
			// }
		},

		onChangeInspectionId: function (oEvent) {
			var inputValue = oEvent.getParameter("value");
			if (inputValue.length >= 1) {
				oEvent.getSource().setValueState("None");
			}
		},

		onChangeInspector: function (oEvent) {
			var inputValue = oEvent.getParameter("value");
			if (inputValue.length >= 1) {
				oEvent.getSource().setValueState("None");
			}
		},

		onChangeWorkingGroup: function (oEvent) {
			var inputValue = oEvent.getParameter("value");
			if (inputValue.length >= 1) {
				oEvent.getSource().setValueState("None");
			}
			if (oEvent.getSource().getValue().length === 0) {
				oEvent.getSource().setValueState("Error");
				this.getView().getModel("CreateInsModel").setProperty("/workingGroup", "");
			}
		},

		onSelectSection81: function (oEvent) {
			var selected = oEvent.getParameter("selected");
			this.getView().getModel("CreateInsModel").setProperty("/section81", selected);
			oEvent.getSource().setValueState("None");
			if (selected) {
				this.getView().getModel("CreateInsModel").setProperty("/section81ChkBox", false);
				this.getView().getModel("CreateInsModel").setProperty("/PrimarySecondryBtns", false);
				this.getView().byId("idInspectionCoordinator").setSelectedItem(null);
				this.getView().byId("idRelatedPermitNumber").setValueState("None");
				this.getView().byId("idRelatedPermitNumber").setValue("");
				this.getView().getModel("CreateInsModel").setProperty("/showFields", false);
				this.getView().getModel("CreateInsModel").setProperty("/workingGroup", "");
				this.getView().byId("idInput").setValue("");
			} else {
				this.getView().getModel("CreateInsModel").setProperty("/section81ChkBox", true);
				// this.getView().getModel("CreateInsModel").setProperty("/PrimarySecondryBtns", true);
				this.getView().byId("idInspectionCoordinator").setSelectedItem(null);
			}

		},

		onSelectInspectionCoordinator: function (oEvent) {
			if (oEvent.getParameter("selectedItem") !== null) {
				var selItem = oEvent.getParameter("selectedItem").getKey();
				this.getView().getModel("CreateInsModel").setProperty("/InspectionCoordinator", selItem);
				oEvent.getSource().setValueState("None");
			}

		},

		onPressPrimaryContractor: function () {
			var primaryContractor = this.getView().getModel("CreateInsModel").getProperty("/PrimaryContractor");
			this._setContractor(primaryContractor);
		},

		onPressSecondaryContractor: function () {
			var secondaryContractor = this.getView().getModel("CreateInsModel").getProperty("/SecondaryContractor");
			this._setContractor(secondaryContractor);
		},

		onPressGetDetails: function () {
			var inputVal = this.getView().byId("idRelatedPermitNumber").getValue();
			if (inputVal === "" || inputVal.length === 0) {
				sap.m.MessageToast.show("Enter PErmit number");
			} else {
				BusyIndicator.show(0);
				this.byId("idInput").setValue("");
				this.getView().byId("idCheckBox").setValueState("None");
				var relatedPermitNumber = this.getView().getModel("CreateInsModel").getProperty("/permitNumber");
				var oCreatePromise = ApiFacade.getInstance().getRelatedPermitNumberDetail(relatedPermitNumber);
				oCreatePromise.then(function (data) {
						this.RelatedPermitNumber = true;
						this.getView().byId("idRelatedPermitNumber").setValueState("None");
						this._setRelatedPermitNumber(data);
						this.getView().getModel("CreateInsModel").setProperty("/showFields", true);
						this.getView().getModel("CreateInsModel").setProperty("/PrimarySecondryBtns", true);
						BusyIndicator.hide();
					}.bind(this))
					.catch(
						function (oReject) {
							BusyIndicator.hide();
							if (oReject.error.status === 404) {
								MessageBox.warning(this.getResourceBundle().getText("noPermitFound"));
							} else {
								var errorMessage = oReject.error.responseText;
								if (typeof errorMessage !== "string") {
									errorMessage = errorMessage.message;
								}
								if (errorMessage && errorMessage !== "") {
									MessageBox.warning(errorMessage);
								} else {
									MessageBox.warning("permitSearchError");
								}
							}
						}.bind(this)
					);
			}
		},

		onHome: function () {
			MessageBox.confirm(
				"Do you want to cancel the application? If cancelled all unsaved data lost.", {
					actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === MessageBox.Action.OK) {
							this.oRouter.navTo("RouteHome", null, true);
						}
					}.bind(this)
				}
			);

		},

		_createModel: function () {
			var data = {
				showFields: false,
				section81: false,
				InspectionDateTime: "",
				DueDate: "",
				permitNumber: "",
				internalId: "",
				inspectorName: "",
				workingGroup: "",
				section81ChkBox: true,
				PrimarySecondryBtns: false
			};
			var oModel = new JSONModel(data);
			this.getView().setModel(oModel, "CreateInsModel");

		},

		_getTypesMapping: function(){
			ApiFacade.getInstance().getStaticDataMappging("INSPECTION_TYPE")
			.then(function (data) {
				var oFinalMapping = {};
					data.forEach(function(oItem){
						if(oFinalMapping[oItem.sourceKey]){
							oFinalMapping[oItem.sourceKey][[oItem.targetKey]] = oItem.targetKey;
						}else{
							oFinalMapping[oItem.sourceKey] = {};
							oFinalMapping[oItem.sourceKey][[oItem.targetKey]] = oItem.targetKey;
						}
					}.bind(this));
					this.aTypesCat = oFinalMapping;
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getInspectionTypes: function () {
			var oCreatePromise = ApiFacade.getInstance().getInspectionTypes();
			oCreatePromise.then(function (data) {
					this.getView().getModel("CreateInsModel").setProperty("/type", data);
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getInspectionCategory: function () {
			var oCreatePromise = ApiFacade.getInstance().getInspectionCategory();
			oCreatePromise.then(function (data) {
				this._aCategory = data;
					this.getView().getModel("CreateInsModel").setProperty("/category", []);
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getInspectionOutcomes: function () {
			var oCreatePromise = ApiFacade.getInstance().getInspectionOutcome();
			oCreatePromise.then(function (data) {
					this.getView().getModel("CreateInsModel").setProperty("/outcome", data);
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getInspectionCoordinator: function () {
			var oCreatePromise = ApiFacade.getInstance().getInspectionCoordinator();
			oCreatePromise.then(function (data) {
					this.getView().getModel("CreateInsModel").setProperty("/inspectiondata", data);
					var uniqueArr = [];
					var filterArr = [];
					data.forEach(function (param) {
						if (uniqueArr.indexOf(param.complianceTeam) === -1) {
							uniqueArr.push(param.complianceTeam);
							filterArr.push(param);
						}
					});
					this.getView().getModel("CreateInsModel").setProperty("/inspectionCoordinator", filterArr);
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		_getWorkingGroup: function () {
			var oCreatePromise = ApiFacade.getInstance().getWorkingGroup();
			oCreatePromise.then(function (data) {
					var model = new JSONModel(data);
					model.setSizeLimit(data.length);
					this.getView().setModel(model, "SuggestModel");
				}.bind(this))
				.catch(
					function (oReject) {
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		},

		//Get Work Types//
		_getWorkTypes: function (event) {
			var oPromise = ApiFacade.getInstance().getStaticData("WORK_TYPE");
			oPromise.then(function (data) {
				this.setModel(new JSONModel(data), "workingTypes");
			}.bind(this))
			.catch(
				function (oReject) {
					this.standardAjaxErrorDisplay(oReject);
				}.bind(this)
			);
			return oPromise;
		},

		_setContractor: function (id) {
			var data = this.getView().getModel("SuggestModel").getData();
			for (var i = 0; i < data.length; i++) {
				if (data[i].contractorId === id  && data[i].defect === true) {
					this.getView().getModel("CreateInsModel").setProperty("/workingGroup", data[i].workingGroupId);
					this.getView().byId("idInput").setValue(data[i].groupName);
					this.getView().byId("idInput").setValueState("None");
					break;
				}
			}
		},

		_setRelatedPermitNumber: function (data) {
			this._getHighwayAuthority(data.highwayAuthority);
			var duration = Formatter.DateFormatwithoutTime(new Date(data.proposedStartDate)) + " - " + Formatter.DateFormatwithoutTime(new Date(
				data.proposedEndDate));
			this.setInspectionCoordinator(data.highwayAuthority);
			this.getView().getModel("CreateInsModel").setProperty("/highwayAuthority", data.highwayAuthority);
			this.getView().getModel("CreateInsModel").setProperty("/permitNumber", data.permitReferenceNumber);
			this.getView().getModel("CreateInsModel").setProperty("/workType", data.workType);
			var str = "";
			if (data.street) {
				str += data.street;
			}
			if (data.area) {
				str += ", " + data.area;
			}
			if (data.town) {
				str += ", " + data.town;
			}
			this.getView().getModel("CreateInsModel").setProperty("/street", str);
			this.getView().getModel("CreateInsModel").setProperty("/traaficManagementType", data.trafficManagementTypeValue);
			this.getView().getModel("CreateInsModel").setProperty("/closeFootway", data.closeFootwayValue);
			this.getView().getModel("CreateInsModel").setProperty("/position", data.positionOfWorks);
			this.getView().getModel("CreateInsModel").setProperty("/siteNumber", data.siteNumber);
			this.getView().getModel("CreateInsModel").setProperty("/location", data.locationDescription);
			this.getView().getModel("CreateInsModel").setProperty("/workStatus", data.workStatusValue);
			this.getView().getModel("CreateInsModel").setProperty("/description", data.workDescription);
			this.getView().getModel("CreateInsModel").setProperty("/PrimaryContractor", data.primaryContractorId);
			this.getView().getModel("CreateInsModel").setProperty("/SecondaryContractor", data.secondaryContractorId);
			this.getView().getModel("CreateInsModel").setProperty("/duration", duration);
		},

		_validateFields: function () {
			var valid = true;
			if (this.RelatedPermitNumber === false) {
				this.getView().byId("idRelatedPermitNumber").setValueState("Error");
				if (this.getView().getModel("CreateInsModel").getProperty("/section81") === false) {
					this.getView().byId("idCheckBox").setValueState("Error");
					this.getView().byId("idRelatedPermitNumber").setValueState("Error");
					valid = false;
				} else {
					this.getView().byId("idCheckBox").setValueState("None");
					this.getView().byId("idRelatedPermitNumber").setValueState("None");
				}
			}

			if (this.getView().byId("idInspectionCoordinator").getSelectedItem() === null) {
				this.getView().byId("idInspectionCoordinator").setValueState("Error");
				this.getView().byId("idInspectionCoordinator").setValueStateText("Mandatory Field");
				valid = false;
			}
			if (this.getView().byId("idInspectionType").getSelectedItem() === null) {
				this.getView().byId("idInspectionType").setValueState("Error");
				valid = false;
			}
			if (this.getView().byId("idInspectionCategory").getSelectedItem() === null) {
				this.getView().byId("idInspectionCategory").setValueState("Error");
				valid = false;
			}
			if (this.getView().byId("idInspectionOutcome").getSelectedItem() === null) {
				this.getView().byId("idInspectionOutcome").setValueState("Error");
				valid = false;
			}

			if (this.getView().getModel("CreateInsModel").getProperty("/InspectionDateTime").length === 0) {
				this.getView().byId("idInspectionDateTime").setValueState("Error");
				valid = false;
			}
			if (this.getView().getModel("CreateInsModel").getProperty("/DueDate").length === 0) {
				this.getView().byId("idDueDate").setValueState("Error");
				valid = false;
			}
			if (this.getView().getModel("CreateInsModel").getProperty("/inspectorName").length === 0) {
				this.getView().byId("idInspectorName").setValueState("Error");
				valid = false;
			}
			if (this.getView().getModel("CreateInsModel").getProperty("/workingGroup").length === 0) {
				this.getView().byId("idInput").setValueState("Error");
				valid = false;
			}
			return valid;
		},

		_saveNotes: function () {
			var payload = {
				note: this.getView().getModel("CreateInsModel").getProperty("/notes"),
			};
			var Noteval = this.getView().byId("idIntNotes").getValue();
			var applicationId = this.getView().getModel("CreateInsModel").getProperty("/inspectionID");
			if (Noteval !== "" || Noteval.length !== 0) {
				var oCreatePromise = ApiFacade.getInstance().CreateInspectionNotes(applicationId, payload);
				oCreatePromise.then(function (data) {

					}.bind(this))
					.catch(
						function (oReject) {
							this.standardAjaxErrorDisplay(oReject);
						}.bind(this)
					);
			}
		},

		setInspectionCoordinator: function (swaCode) {
			var data = this.getView().getModel("CreateInsModel").getProperty("/inspectiondata");
			var oData = null;
			data.forEach(function (param) {
				if (param.swaOrgRef === swaCode) {
					oData = param;
				}
			});
			if (oData !== null) {
				this.getView().byId("idInspectionCoordinator").setSelectedKey(oData.complianceTeam);
				this.getView().byId("idInspectionCoordinator").setValueState("None");
			}
		},

		getDueDateCalculation: function () {
			var Instype = this.getView().byId("idInspectionType").getSelectedItem();
			var category = this.getView().byId("idInspectionCategory").getSelectedItem();
			var outcome = this.getView().byId("idInspectionOutcome").getSelectedItem();
			var isDate = this.getView().getModel("CreateInsModel").getProperty("/InspectionDateTime") ? new Date(this.getView().getModel("CreateInsModel").getProperty("/InspectionDateTime")).toISOString().split("Z")[0] : null;
			if (Instype && category && outcome && isDate) {
				var oCreatePromise = ApiFacade.getInstance().getInspectionduedatecalculation(Instype.getKey().toLowerCase(), category.getKey().toLowerCase(),
					outcome.getKey().toLowerCase(), isDate);
				oCreatePromise.then(function (data) {
						if (data.dueDate !== "N/A") {
							this.getView().getModel("CreateInsModel").setProperty("/dueDate", new Date(data.dueDate).toISOString());
							this.getView().byId("idDueDate").setDateValue(new Date(data.dueDate));
							this.getView().byId("idDueDate").setValueState("None");
						}
					}.bind(this))
					.catch(
						function (oReject) {
							this.standardAjaxErrorDisplay(oReject);
						}.bind(this)
					);
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

		updateAttachments: function (data) {
			var aItems = this.getView().byId("IdCreateInspectionupload").getItems();
			var aFormFiles = [];
			var aFinalFiles = [];
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

			if (aFormFiles.length > 0) {
				var aPromises = [];
				aFormFiles.forEach(function (oFormFile) {
					var oCreatePromise = ApiFacade.getInstance().createInspectionFile(
						oFormFile,
						data.inspectionId
					);
					oCreatePromise.then(function (oData) {

					}.bind(this));
					aPromises.push(oCreatePromise);
				}.bind(this));

				Promise.all(aPromises)
					.then(
						function (aResolve) {
							this.getView().getModel("CreateInsModel").setProperty("/inspectionID", data.inspectionId);
							this.getOwnerComponent().getModel("CreateManInsModel").setData(data);
							this._saveNotes();
							//Hide busy application
							BusyIndicator.hide();
							this.doNavTo("Inspection", {
								state: data.inspectionId,
								mode: "manual-inspection-detail"
							});
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
				this.getView().getModel("CreateInsModel").setProperty("/inspectionID", data.inspectionId);
				this.getOwnerComponent().getModel("CreateManInsModel").setData(data);
				this._saveNotes();
				BusyIndicator.hide();
				this.doNavTo("Inspection", {
					state: data.inspectionId,
					mode: "manual-inspection-detail"
				});
			}
		},

		onsuggestionItemSelected: function (evt) {
			if (evt.getParameter("selectedItem") !== null) {
				this.getView().getModel("CreateInsModel").setProperty("/workingGroup", evt.getParameter("selectedItem").getKey());
			}
		},

		_getHighwayAuthority: function (highwayAuthority) {
			var oCreatePromise = ApiFacade.getInstance().getHighwayAuthority();
			oCreatePromise.then(function (data) {
					data.forEach(function (item) {
						if (highwayAuthority === item.swaCode) {
							this.getView().getModel("CreateInsModel").setProperty("/Authority", item.name);
							this.getView().getModel("CreateInsModel").refresh(true);
						}
					}.bind(this));
				}.bind(this))
				.catch(
					function (oReject) {
						BusyIndicator.hide();
						this.standardAjaxErrorDisplay(oReject);
					}.bind(this)
				);
		}
	});

});