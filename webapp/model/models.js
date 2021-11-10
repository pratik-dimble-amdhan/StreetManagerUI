sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/Device"
], function (JSONModel, Device) {
	"use strict";

	return {

		createDeviceModel: function () {
			var oModel = new JSONModel(Device);
			oModel.setDefaultBindingMode("OneWay");
			return oModel;
		},

		createModel: function () {
			var data = {
				CSRFToken: "",
				sapkey: "",
				workno: "",
				workoperationno: "",
				primaryContractor: [],
				secondaryContractor: [],
				tmContractor: [],
				otherContractor: [],
				trafficManagementType: [],
				operationalZone: [],
				collaborationType: [],
				locationType: [],
				highwayAuthority: [],
				SelectedLocation: "",
				permitConditions: [],
				ttReason: [],
				footwayclosure: [],
				WrpAuthority: [],
				workIdentifier: [],
				departmentIdentifier: [],
				workdateRange: "",
				outofhour: "",
				trafficType: "",
				footwayClosure: "No",
				collaborativeWorking: false,
				CollaborationDetails: "",
				Collaborationworksreference: "",
				activities: [],
				jointingDate: "",
				excavationRequired: "",
				wrp: "",
				WRPauthorityDisplay: "",
				roadCategory: "",
				specialDesignation: [],
				specialDesigDescription: "",
				Notifications: [],
				faultPermitCount: "None",
				isPlannedPermit: "",
				isEarlyStart: false,
				StartDate: new Date(),
				IncidentProjectNumber: "",
				USRN: "",
				Worksdescription: "",
				Personresponsible: "",
				Groupresponsible: "",
				CommentstoHighwayAuthority: "",
				Externalreference: "",
				ProjectReference: "",
				PersonresponsContactdetails: "",
				isTtroRequired: "",
				LocationDescription: "",
				AgreementReferenceNo: "",
				isApplicationId: "",
				area: "",
				street: "",
				collaborationDetails: "",
				collaborationWorkText: "",
				conditions: [],
				selectedSplDesignations: [],
				footwayClosureKey: "no",
				isNavigationFault: false,
				valid_from: "",
				valid_to: "",
				Jointingdate: "",
				isErrorLocation: false,
				isErrorFault: false,
				preApprovalDetails: "",
				preApprovalAuthoriser: "",
				earlyStartReason: "",
				earlyStartPreApprovalFlag: "",
				Proposedworkdate: "",
				jointingFlag: "",
				privateLandFlag: false,
				IncidentNumber: "",
				upLoadURL: "",
				isCommentId: "",
				DiffIncidentNumbers: [],
				trafficSensitive: "",
				SlidingStatic: "",
				LatestStartDate: "",
				town: "",
				ApplicationDetails: [],
				LaneRentalFlag: false,
				InputpersonResponsible: "",
				workCategory: "immediate_urgent",
				Requestor: "",
				ttroObtained: "",
				collaborativeWorkingFlag: "no",
				closeFootway: "NO",
				UKPNWorksReferenceNumber: "",
				FaultWorkStartTimeFlag: false,
				WorkingGroupId: "",
				LocationAgreement: "",
				authoritylicenceworksVisible: false,
				Licencenumber: "",
				sendEmailtoAuthority: false,
				isPrivateFault: false,
				isPrivatePlanned: false,
				highwayAuthorityContactId: "",
				licenseAuthority: "",
				workType: "",
				requestId: "",
				permitMode:"",
				isFaultPermit: false
			};
			var oModel = new JSONModel(data);
			return oModel;
		},

		createRegistrationModel: function () {
			var data = {
				PermitNo: "",
				UKPNWorksReferenceNo: "",
				SAPWorkOrderNumber: "",
				SAPWorkOrderOperationNo: "",
				isRegisterPermitId: "",
				totalSites: "",
				totalUnits: "",
				Position: [],
				Sites: [],
				AddSiteNo: "001",
				enableAddSiteBtns: false,
				appData: "",
				CSRFToken: "",
				tableButtons: false,
				deleteButton: false
			};
			var oModel = new JSONModel(data);
			return oModel;
		},
		createInspectionModel: function () {
			var data = {
				status: "",
				InspectionStatus: [],
				InspectionChangeStatus: [],
				InspectionStatusComment: "",
				InspectionStatusId: "",
				workingGroupId: ""
			};
			var oModel = new JSONModel(data);
			return oModel;
		},
		createManualInspectionModel: function () {
			var data = {};
			var oModel = new JSONModel(data);
			return oModel;
		},

		createPermitHistoryModel: function () {
			var data = {
				selectedTab: "",
				permitReferenceNumber: "",
				status: "",
				primaryContractor: [],
				secondaryContractor: [],
				otherContractor: [],
				tmContractor: [],
				workIdentifier: [],
				collaborationType: [],
				workingGroup: []
			};
			var oModel = new JSONModel(data);
			return oModel;
		},
		createExtendPermitModel: function () {
			var data = {
				extendPermitDate: "",
				extendPermitComment: "",
				permitDetailClicked: false
			};
			var oModel = new JSONModel(data);
			return oModel;
		},

		createPermitCancelModel: function () {
			var data = {
				permitCancelComment: "",
				applicationId: ""
			};
			var oModel = new JSONModel(data);
			return oModel;
		},

		createPermitRevertModel: function () {
			var data = {
				permitRevertReason: "",
				applicationId: "",
				permitDetailClicked: false
			};
			var oModel = new JSONModel(data);
			return oModel;
		},
		createPermitJointingModel: function () {
			var data = {
				applicationId: "",
				permitDetailClicked: false
			};
			var oModel = new JSONModel(data);
			return oModel;
		}

	};
});