/***********************************************************
* Developer: Minhas Kamal (minhaskamal024@gmail.com)       *
* Website: https://github.com/MinhasKamal/DownGit          *
* License: MIT License                                     *
***********************************************************/

var homeModule = angular.module('homeModule', [
    'ngRoute',
    'downGitModule',
]);

homeModule.config([
    '$routeProvider',

    function ($routeProvider) {
        $routeProvider
            .when('/home', {
                templateUrl: 'app/home/home.html',
                controller: [
                '$scope',
                '$routeParams',
                '$location',
                'toastr',
                'downGitService',

                function($scope, $routeParams, $location, toastr, downGitService) {
                    $scope.url = "";
                    $scope.shareableLink = "";
                    $scope.isProcessing = {val: false};
                    $scope.downloadedFiles = {val: 0};
                    $scope.totalFiles = {val: 0};

                    var templateUrl = "https?://github.com/.+/.+";
                    var downloadUrlInfix = "#/home?url=";
                    var downloadUrlPrefix = window.location.origin + window.location.pathname + downloadUrlInfix;

                    if ($routeParams.url) {
                        $scope.url = $routeParams.url;
                    }

                    if ($scope.url && $scope.url.match(templateUrl)) {
                        var parameter = {
                            url: $scope.url,
                            fileName: $routeParams.fileName,
                            rootDirectory: $routeParams.rootDirectory
                        };
                        var progress = {
                            isProcessing: $scope.isProcessing,
                            downloadedFiles: $scope.downloadedFiles,
                            totalFiles: $scope.totalFiles
                        };
                        downGitService.downloadZippedFiles(parameter, progress, toastr);

                    } else if ($scope.url != "") {
                        toastr.warning("Invalid GitHub URL!", {iconClass: 'toast-down'});
                    }

                    $scope.catchEnter = function(keyEvent) {
                        if (keyEvent.which == 13) {
                            $scope.download();
                        }
                    };

                    $scope.clearUrl = function() {
                        $scope.url = "";
                        $scope.shareableLink = "";
                    };

                    $scope.copyToClipboard = function() {
                        var textArea = document.createElement("textarea");
                        textArea.value = $scope.shareableLink;
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        toastr.success("Link copied to clipboard!", {iconClass: 'toast-down'});
                    };

                    $scope.download = function() {
                        if (!$scope.url) {
                            toastr.warning("Please enter a GitHub URL!", {iconClass: 'toast-down'});
                            return;
                        }

                        if ($scope.url.match(templateUrl)) {
                            // Generate shareable link
                            $scope.shareableLink = downloadUrlPrefix + encodeURIComponent($scope.url);
                            
                            var parameter = {
                                url: $scope.url,
                                fileName: $routeParams.fileName,
                                rootDirectory: $routeParams.rootDirectory
                            };
                            var progress = {
                                isProcessing: $scope.isProcessing,
                                downloadedFiles: $scope.downloadedFiles,
                                totalFiles: $scope.totalFiles
                            };
                            downGitService.downloadZippedFiles(parameter, progress, toastr);
                        } else {
                            toastr.warning("Invalid GitHub URL!", {iconClass: 'toast-down'});
                        }
                    };

                }],
            });
    }
]);
