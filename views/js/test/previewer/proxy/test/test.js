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
 * Copyright (c) 2020-2022 (original work) Open Assessment Technologies SA ;
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
], function ($, _, urlUtil, communicatorFactory, proxyFactory, testProxy, initTestPreview, initTestPreview2Items) {
    'use strict';

    QUnit.module('testProxy');

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Restore AJAX method after each test
    QUnit.testDone(() => $.mockjax.clear());

    const testContext = {
        allowSkipping: false,
        canMoveBackward: true,
        itemIdentifier: 'item-1',
        itemPosition: 0,
        itemSessionState: 0,
        sectionId: 'assessmentSection-1',
        state: 1,
        testPartId: 'testPart-1',
        attempt: 1,
        options: {}
    };

    QUnit.test('module', assert => {
        assert.expect(6);
        assert.equal(typeof testProxy, 'object', 'The testProxy module exposes an object');
        assert.equal(typeof proxyFactory, 'function', 'The proxyFactory module exposes a function');
        assert.equal(
            typeof proxyFactory.registerProvider,
            'function',
            'The proxyFactory module exposes a registerProvider method'
        );
        assert.equal(
            typeof proxyFactory.getProvider,
            'function',
            'The proxyFactory module exposes a getProvider method'
        );

        proxyFactory.registerProvider('testProxy', testProxy);

        assert.equal(
            typeof proxyFactory('testProxy'),
            'object',
            'The proxyFactory factory has registered the testProxy definition and produces an instance'
        );
        assert.notStrictEqual(
            proxyFactory('testProxy'),
            proxyFactory('testProxy'),
            'The proxyFactory factory provides a different instance of testProxy on each call'
        );
    });

    QUnit.cases
        .init([
            { title: 'install' },
            { title: 'init' },
            { title: 'destroy' },
            { title: 'callTestAction' },
            { title: 'getItem' },
            { title: 'callItemAction' }
        ])
        .test('proxy API ', (data, assert) => {
            assert.expect(1);
            assert.equal(
                typeof testProxy[data.title],
                'function',
                `The testProxy definition exposes a "${data.title}" function`
            );
        });

    QUnit.cases
        .init([
            {
                title: 'success',
                response: initTestPreview,
                ajaxSuccess: true,
                success: true
            },
            {
                title: 'failing data',
                response: {
                    errorCode: 1,
                    errorMessage: 'oops',
                    success: false
                },
                ajaxSuccess: true,
                success: false
            },
            {
                title: 'failing request',
                response: 'error',
                ajaxSuccess: false,
                success: false
            }
        ])
        .test('testProxy.init ', (caseData, assert) => {
            const ready = assert.async();
            const initConfig = {
                options: {
                    testUri: 'mockUri'
                }
            };

            assert.expect(5);

            proxyFactory.registerProvider('testProxy', testProxy);

            $.mockjax({
                url: '/*',
                status: caseData.ajaxSuccess ? 200 : 500,
                responseText: caseData.response
            });

            const proxy = proxyFactory('testProxy', initConfig);

            proxy
                .install()
                .then(() => {
                    proxy.on('init', (promise, config) => {
                        assert.ok(true, 'The proxy has fired the "init" event');
                        assert.equal(
                            typeof promise,
                            'object',
                            'The proxy has provided the promise through the "init" event'
                        );
                        assert.equal(
                            config,
                            initConfig,
                            'The proxy has provided the config object through the "init" event'
                        );
                    });

                    const result = proxy.init();

                    assert.equal(typeof result, 'object', 'The proxy.init method has returned a promise');

                    return result;
                })
                .then(data => {
                    if (caseData.success) {
                        assert.deepEqual(data.testContext, testContext, 'The proxy has returned the expected data');
                    } else {
                        assert.ok(false, 'The proxy must throw an error!');
                    }
                })
                .catch(err => {
                    assert.ok(!caseData.success, `The proxy has thrown an error! #${err}`);
                })
                .then(ready);
        });

    QUnit.test('testProxy.destroy', assert => {
        const ready = assert.async();
        const initConfig = {
            options: {
                testUri: 'mockUri'
            }
        };

        assert.expect(5);

        proxyFactory.registerProvider('testProxy', testProxy);

        $.mockjax([
            {
                url: '*/init',
                status: 200,
                responseText: initTestPreview
            },
            {
                url: '/*',
                status: 500,
                response() {
                    assert.ok(false, 'The proxy must not use an ajax request to destroy the instance!');
                }
            }
        ]);

        const proxy = proxyFactory('testProxy', initConfig);

        proxy
            .install()
            .then(() => {
                return proxy.init();
            })
            .then(() => {
                proxy.on('destroy', promise => {
                    assert.ok(true, 'The proxyFactory has fired the "destroy" event');
                    assert.equal(
                        typeof promise,
                        'object',
                        'The proxy has provided the promise through the "destroy" event'
                    );
                });

                const result = proxy.destroy();

                assert.equal(typeof result, 'object', 'The proxy.destroy method has returned a promise');

                return result;
            })
            .then(() => {
                assert.ok(true, 'The proxy has resolved the promise provided by the "destroy" method!');

                proxy
                    .getTestContext()
                    .then(() => {
                        assert.ok(false, 'The proxy must be initialized');
                        ready();
                    })
                    .catch(() => {
                        assert.ok(true, 'The proxy must be initialized');
                        ready();
                    });
            })
            .catch(err => {
                assert.ok(false, err.message);
                ready();
            });
    });

    QUnit.cases
        .init([
            {
                title: 'success',
                itemIdentifier: 'item-1',
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
            },
            {
                title: 'failing data',
                itemIdentifier: 'item-1',
                response: {
                    errorCode: 1,
                    errorMessage: 'oops',
                    success: false
                },
                ajaxSuccess: false,
                success: false
            },
            {
                title: 'failing request',
                itemIdentifier: 'item-1',
                response: 'error',
                ajaxSuccess: false,
                success: false
            }
        ])
        .test('testProxy.getItem ', (caseData, assert) => {
            const ready = assert.async();
            const initConfig = {
                options: {
                    testUri: 'mockUri'
                }
            };

            const expectedUrl = urlUtil.route('getItem', 'Previewer', 'taoQtiTestPreviewer');

            assert.expect(7);

            proxyFactory.registerProvider('testProxy', testProxy);

            $.mockjax([
                {
                    url: '*/init',
                    status: 200,
                    responseText: initTestPreview
                },
                {
                    url: '/*',
                    status: caseData.ajaxSuccess ? 200 : 500,
                    responseText: caseData.response,
                    response(settings) {
                        assert.equal(settings.url, expectedUrl, 'The proxy has called the right service');
                    }
                }
            ]);

            const proxy = proxyFactory('testProxy', initConfig);

            proxy
                .install()
                .then(() => {
                    return proxy.getItem(caseData.itemIdentifier);
                })
                .then(() => {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(() => {
                    assert.ok(true, 'The proxy must be initialized');
                })
                .then(() => {
                    return proxy.init();
                })
                .then(() => {
                    proxy.on('getItem', (promise, itemIdentifier) => {
                        assert.ok(true, 'The proxy has fired the "getItem" event');
                        assert.equal(
                            typeof promise,
                            'object',
                            'The proxy has provided the promise through the "getItem" event'
                        );
                        assert.equal(
                            itemIdentifier,
                            caseData.itemIdentifier,
                            'The proxy has provided the itemIdentifier through the "getItem" event'
                        );
                    });

                    const result = proxy.getItem(caseData.itemIdentifier);

                    assert.equal(typeof result, 'object', 'The proxy.getItem method has returned a promise');

                    return result;
                })
                .then(data => {
                    if (caseData.success) {
                        assert.deepEqual(
                            data.itemData,
                            caseData.response.content,
                            'The proxy has returned the expected data'
                        );
                    } else {
                        assert.ok(false, 'The proxy must throw an error!');
                    }
                })
                .catch(err => {
                    assert.ok(!caseData.success, `The proxy has thrown an error! #${err}`);
                })
                .then(ready);
        });

    QUnit.cases
        .init([
            {
                title: 'move next',
                itemIdentifier: 'item-1',
                action: 'move',
                params: {
                    direction: 'next'
                },
                resultContext: {
                    allowSkipping: false,
                    canMoveBackward: true,
                    itemIdentifier: 'item-2',
                    itemPosition: 1,
                    sectionId: 'assessmentSection-1',
                    state: 1,
                    testPartId: 'testPart-1',
                    itemSessionState: 0,
                    attempt: 1,
                    options: {}
                }
            },
            {
                title: 'move jump',
                itemIdentifier: 'item-1',
                action: 'move',
                params: {
                    direction: 'jump',
                    ref: 1
                },
                resultContext: {
                    allowSkipping: false,
                    canMoveBackward: true,
                    itemIdentifier: 'item-2',
                    itemPosition: 1,
                    sectionId: 'assessmentSection-1',
                    state: 1,
                    testPartId: 'testPart-1',
                    itemSessionState: 0,
                    attempt: 1,
                    options: {}
                }
            },
            {
                title: 'skip next',
                itemIdentifier: 'item-1',
                action: 'move',
                params: {
                    direction: 'next'
                },
                resultContext: {
                    allowSkipping: false,
                    canMoveBackward: true,
                    itemIdentifier: 'item-2',
                    itemPosition: 1,
                    sectionId: 'assessmentSection-1',
                    state: 1,
                    testPartId: 'testPart-1',
                    itemSessionState: 0,
                    attempt: 1,
                    options: {}
                }
            }
        ])
        .test('testProxy.callItemAction ', (caseData, assert) => {
            const ready = assert.async();
            const initConfig = {
                options: {
                    testUri: 'mockUri'
                }
            };

            assert.expect(8);

            proxyFactory.registerProvider('testProxy', testProxy);

            $.mockjax([
                {
                    url: '*/init',
                    status: 200,
                    responseText: initTestPreview2Items
                }
            ]);

            const proxy = proxyFactory('testProxy', initConfig);

            proxy
                .install()
                .then(() => {
                    return proxy.callItemAction(caseData.uri, caseData.action, caseData.params);
                })
                .then(() => {
                    assert.ok(false, 'The proxy must be initialized');
                })
                .catch(() => {
                    assert.ok(true, 'The proxy must be initialized');
                })
                .then(() => {
                    return proxy.init();
                })
                .then(data => {
                    proxy.getDataHolder = () => {
                        return {
                            get: key => data[key]
                        };
                    };
                    proxy.on('callItemAction', (promise, itemIdentifier, action, params) => {
                        assert.ok(true, 'The proxy has fired the "callItemAction" event');
                        assert.equal(
                            typeof promise,
                            'object',
                            'The proxy has provided the promise through the "callItemAction" event'
                        );
                        assert.equal(
                            itemIdentifier,
                            caseData.itemIdentifier,
                            'The proxy has provided the itemIdentifier through the "callItemAction" event'
                        );
                        assert.equal(
                            action,
                            caseData.action,
                            'The proxy has provided the action through the "callItemAction" event'
                        );
                        assert.deepEqual(
                            params,
                            caseData.params,
                            'The proxy has provided the params through the "callItemAction" event'
                        );
                    });

                    const result = proxy.callItemAction(caseData.itemIdentifier, caseData.action, caseData.params);

                    assert.equal(typeof result, 'object', 'The proxy.callItemAction method has returned a promise');

                    return result;
                })
                .then(data => {
                    assert.deepEqual(
                        data.testContext,
                        caseData.resultContext,
                        'The proxy has returned the expected data'
                    );
                })
                .then(ready);
        });
});
