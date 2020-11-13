/**
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; under version 2
 * of the License (non-upgradable).
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
 *
 * Copyright (c) 2020 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Hanna Dzmitryieva <hanna@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'util/url',
    'core/communicator',
    'taoTests/runner/proxy',
    'taoQtiTestPreviewer/previewer/proxy/test',
    'json!taoQtiTestPreviewer/test/samples/json/initTestPreview.json',
    'json!taoQtiTestPreviewer/test/samples/json/initTestPreview2Items.json',
    'lib/jquery.mockjax/jquery.mockjax'
], function($, _, urlUtil, communicatorFactory, proxyFactory, testProxy, initTestPreview, initTestPreview2Items) {
    'use strict';

    QUnit.module('testProxy');

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Restore AJAX method after each test
    QUnit.testDone(function() {
        $.mockjax.clear();
    });

    const testContext = {
        canMoveBackward: true,
        itemIdentifier: 'item-1',
        itemPosition: 0,
        sectionId: 'assessmentSection-1',
        state: 0,
        testPartId: 'testPart-1',
        attempt: 1
    };

    QUnit.test('module', function(assert) {
        assert.expect(6);
        assert.equal(typeof testProxy, 'object', 'The testProxy module exposes an object');
        assert.equal(typeof proxyFactory, 'function', 'The proxyFactory module exposes a function');
        assert.equal(typeof proxyFactory.registerProvider, 'function', 'The proxyFactory module exposes a registerProvider method');
        assert.equal(typeof proxyFactory.getProvider, 'function', 'The proxyFactory module exposes a getProvider method');

        proxyFactory.registerProvider('testProxy', testProxy);

        assert.equal(typeof proxyFactory('testProxy'), 'object', 'The proxyFactory factory has registered the testProxy definition and produces an instance');
        assert.notStrictEqual(proxyFactory('testProxy'), proxyFactory('testProxy'), 'The proxyFactory factory provides a different instance of testProxy on each call');
    });

    QUnit
        .cases.init([
            {title: 'install'},
            {title: 'init'},
            {title: 'destroy'},
            {title: 'callTestAction'},
            {title: 'getItem'},
            {title: 'callItemAction'}
        ])
        .test('proxy API ', function(data, assert) {
            assert.expect(1);
            assert.equal(typeof testProxy[data.title], 'function', 'The testProxy definition exposes a "' + data.title + '" function');
        });

    QUnit
        .cases.init([{
            title: 'success',
            sendToken: '1234',
            receiveToken: '4567',
            response: initTestPreview,
            ajaxSuccess: true,
            success: true
        }, {
            title: 'failing data',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                errorCode: 1,
                errorMessage: 'oops',
                success: false
            },
            ajaxSuccess: true,
            success: false
        }, {
            title: 'failing request',
            sendToken: '1234',
            receiveToken: '4567',
            response: 'error',
            ajaxSuccess: false,
            success: false
        }])
        .test('testProxy.init ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                options: {
                    testUri: 'mockUri'
                }
            };

            var proxy, tokenHandler, result;

            assert.expect(6);

            proxyFactory.registerProvider('testProxy', testProxy);

            $.mockjax({
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: caseData.response
            });

            proxy = proxyFactory('testProxy', initConfig);
            tokenHandler = proxy.getTokenHandler();

            proxy
                .install()
                .then(function() {
                    return tokenHandler.clearStore();
                })
                .then(function() {
                    return proxy.getTokenHandler().setToken(caseData.sendToken);
                })
                .then(function() {
                    proxy.on('init', function(promise, config) {
                        assert.ok(true, 'The proxy has fired the "init" event');
                        assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "init" event');
                        assert.equal(config, initConfig, 'The proxy has provided the config object through the "init" event');
                    });

                    result = proxy.init();

                    assert.equal(typeof result, 'object', 'The proxy.init method has returned a promise');

                    return result;
                })
                .then(function(data) {
                    if (caseData.success) {
                        assert.deepEqual(data.testContext, testContext, 'The proxy has returned the expected data');
                    } else {
                        assert.ok(false, 'The proxy must throw an error!');
                    }
                })
                .catch(function(err) {
                    assert.ok(!caseData.success, 'The proxy has thrown an error! #' + err);
                })
                .then(function() {
                    return proxy.getTokenHandler().getToken().then(function(token) {
                        assert.equal(token, caseData.receiveToken, 'The proxy must update the security token');
                    });
                })
                .then(function() {
                    ready();
                });
        });

    QUnit.test('testProxy.destroy', function(assert) {
        var ready = assert.async();
        var initConfig = {
            options: {
                testUri: 'mockUri'
            }
        };

        var proxy, tokenHandler, result;

        assert.expect(5);

        proxyFactory.registerProvider('testProxy', testProxy);

        $.mockjax([{
            url: '*/init',
            status: 200,
            responseText: initTestPreview
        }, {
            url: '/*',
            status: 500,
            response: function() {
                assert.ok(false, 'The proxy must not use an ajax request to destroy the instance!');
            }
        }]);

        proxy = proxyFactory('testProxy', initConfig);
        tokenHandler = proxy.getTokenHandler();

        proxy.install()
            .then(function() {
                return tokenHandler.clearStore();
            })
            .then(function() {
                return proxy.init();
            })
            .then(function() {
                proxy.on('destroy', function (promise) {
                    assert.ok(true, 'The proxyFactory has fired the "destroy" event');
                    assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "destroy" event');
                });

                result = proxy.destroy();

                assert.equal(typeof result, 'object', 'The proxy.destroy method has returned a promise');

                return result;
            })
            .then(function() {
                assert.ok(true, 'The proxy has resolved the promise provided by the "destroy" method!');

                proxy.getTestContext()
                    .then(function() {
                        assert.ok(false, 'The proxy must be initialized');
                        ready();
                    })
                    .catch(function() {
                        assert.ok(true, 'The proxy must be initialized');
                        ready();
                    });
            })
            .catch(function(err) {
                assert.ok(false, 'The proxy should not fail!');
                ready();
            });
    });

    QUnit
        .cases.init([{
            title: 'success',
            itemIdentifier: 'item-1',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                content: {
                    data: {
                        identifier: 'item-1'
                    },
                    interactions: [{}]
                },
                itemState: {
                    response: [{}]
                },
                success: true
            },
            ajaxSuccess: true,
            success: true
        }, {
            title: 'failing data',
            itemIdentifier: 'item-1',
            sendToken: '1234',
            receiveToken: '4567',
            response: {
                errorCode: 1,
                errorMessage: 'oops',
                success: false
            },
            ajaxSuccess: false,
            success: false
        }, {
            title: 'failing request',
            itemIdentifier: 'item-1',
            sendToken: '1234',
            receiveToken: '4567',
            response: 'error',
            ajaxSuccess: false,
            success: false
        }])
        .test('testProxy.getItem ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                options: {
                    testUri: 'mockUri'
                }
            };

            var expectedUrl = urlUtil.route('getItem', 'Previewer', 'taoQtiTestPreviewer');

            var proxy, tokenHandler, result;

            assert.expect(8);

            proxyFactory.registerProvider('testProxy', testProxy);

            $.mockjax([{
                url: '*/init',
                status: 200,
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: initTestPreview
            }, {
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: caseData.response,
                response: function(settings) {
                    assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                }
            }]);

            proxy = proxyFactory('testProxy', initConfig);
            tokenHandler = proxy.getTokenHandler();

            proxy
                .install()
                .then(function() {
                    return tokenHandler.clearStore();
                })
                .then(function() {
                    return proxy.getTokenHandler().setToken(caseData.sendToken);
                })
                .then(function() {
                    return proxy.getItem(caseData.itemIdentifier);
                })
                .then(function() {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(function() {
                    assert.ok(true, 'The proxy must be initialized');
                })
                .then(function() {
                    return proxy.init();
                })
                .then(function() {
                    proxy.on('getItem', function (promise, itemIdentifier) {
                        assert.ok(true, 'The proxy has fired the "getItem" event');
                        assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "getItem" event');
                        assert.equal(itemIdentifier, caseData.itemIdentifier, 'The proxy has provided the itemIdentifier through the "getItem" event');
                    });

                    result = proxy.getItem(caseData.itemIdentifier);

                    assert.equal(typeof result, 'object', 'The proxy.getItem method has returned a promise');

                    return result;
                })
                .then(function(data) {
                    if (caseData.success) {
                        assert.deepEqual(data.itemData, caseData.response.content, 'The proxy has returned the expected data');
                    } else {
                        assert.ok(false, 'The proxy must throw an error!');
                    }
                })
                .catch(function(err) {
                    assert.ok(!caseData.success, 'The proxy has thrown an error! #' + err);
                })
                .then(function() {
                    return proxy.getTokenHandler().getToken().then(function(token) {
                        assert.equal(token, caseData.receiveToken, 'The proxy must update the security token');
                    });
                })
                .then(function() {
                    ready();
                });
        });

    QUnit
        .cases.init([{
            title: 'move next',
            itemIdentifier: 'item-1',
            action: 'move',
            params: {
                direction: 'next'
            },
            resultContext: {
                canMoveBackward: true,
                itemIdentifier: 'item-2',
                itemPosition: 1,
                sectionId: 'assessmentSection-1',
                state: 0,
                testPartId: 'testPart-1',
                itemSessionState: 0,
                attempt: 1
            },
        }, {
            title: 'move jump',
            itemIdentifier: 'item-1',
            action: 'move',
            params: {
                direction: 'jump',
                ref: 1
            },
            resultContext: {
                canMoveBackward: true,
                itemIdentifier: 'item-2',
                itemPosition: 1,
                sectionId: 'assessmentSection-1',
                state: 0,
                testPartId: 'testPart-1',
                itemSessionState: 0,
                attempt: 1
            },
        }, {
            title: 'skip next',
            itemIdentifier: 'item-1',
            action: 'move',
            params: {
                direction: 'next',
            },
            resultContext: {
                canMoveBackward: true,
                itemIdentifier: 'item-2',
                itemPosition: 1,
                sectionId: 'assessmentSection-1',
                state: 0,
                testPartId: 'testPart-1',
                itemSessionState: 0,
                attempt: 1
            },
        }])
        .test('testProxy.callItemAction ', function(caseData, assert) {
            var ready = assert.async();
            var initConfig = {
                options: {
                    testUri: 'mockUri'
                }
            };

            var proxy, result;

            assert.expect(8);

            proxyFactory.registerProvider('testProxy', testProxy);

            $.mockjax([{
                url: '*/init',
                status: 200,
                headers: {
                    'X-CSRF-Token': caseData.receiveToken
                },
                responseText: initTestPreview2Items
            }]);

            proxy = proxyFactory('testProxy', initConfig);

            proxy
                .install()
                .then(function() {
                    return proxy.callItemAction(caseData.uri, caseData.action, caseData.params);
                })
                .then(function() {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(function() {
                    assert.ok(true, 'The proxy must be initialized');
                })
                .then(function() {
                    return proxy.init();
                })
                .then(function(data) {
                    proxy.getDataHolder = () => {
                        return {
                            get: key => data[key]
                        };
                    };
                    proxy.on('callItemAction', function (promise, itemIdentifier, action, params) {
                        assert.ok(true, 'The proxy has fired the "callItemAction" event');
                        assert.equal(typeof promise, 'object', 'The proxy has provided the promise through the "callItemAction" event');
                        assert.equal(itemIdentifier, caseData.itemIdentifier, 'The proxy has provided the itemIdentifier through the "callItemAction" event');
                        assert.equal(action, caseData.action, 'The proxy has provided the action through the "callItemAction" event');
                        assert.deepEqual(params, caseData.params, 'The proxy has provided the params through the "callItemAction" event');
                    });

                    result = proxy.callItemAction(caseData.itemIdentifier, caseData.action, caseData.params);

                    assert.equal(typeof result, 'object', 'The proxy.callItemAction method has returned a promise');

                    return result;
                })
                .then(function(data) {
                    assert.deepEqual(data.testContext, caseData.resultContext, 'The proxy has returned the expected data');
                })
                .then(function() {
                    ready();
                });
        });

});
