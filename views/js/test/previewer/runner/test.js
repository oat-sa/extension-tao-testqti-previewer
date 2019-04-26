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
 * Copyright (c) 2018 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'core/promise',
    'taoQtiTestPreviewer/previewer/runner',
    'json!taoQtiItem/test/samples/json/space-shuttle.json',
    'lib/jquery.mockjax/jquery.mockjax',
    'css!taoQtiTestPreviewer/previewer/provider/item/css/item'
], function($, _, Promise, previewerFactory, itemData) {
    'use strict';

    QUnit.module('API');

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Restore AJAX method after each test
    QUnit.testDone(function() {
        $.mockjax.clear();
    });

    QUnit.test('module', function(assert) {
        var ready = assert.async();
        var config = {
            serviceCallId: 'foo',
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }]
        };

        var previewer1 = previewerFactory(config, $('#fixture-1'));
        var previewer2 = previewerFactory(config, $('#fixture-2'));

        assert.expect(4);
        $.mockjax({
            url: '/*',
            responseText: {
                success: true
            }
        });
        assert.equal(typeof previewerFactory, 'function', 'The previewer module exposes a function');
        assert.equal(typeof previewer1, 'object', 'The previewer factory returns an object');
        assert.equal(typeof previewer2, 'object', 'The previewer factory returns an object');
        assert.notEqual(previewer1, previewer2, 'The previewer factory returns a different instance on each call');

        Promise.all([
            new Promise(function(resolve) {
                previewer1.on('ready', resolve);
            }),
            new Promise(function(resolve) {
                previewer2.on('ready', resolve);
            })
        ]).catch(function(err) {
            assert.pushResult({
                result: false,
                message: err
            });
        }).then(function() {
            ready();
        });
    });

    QUnit.cases.init([{
        title: 'itemData in init',
        fixture: '#fixture-item-1',
        mock: {
            url: '/init*',
            responseText: {
                success: true,
                itemIdentifier: 'item-1',
                itemData: {
                    content: {
                        type: 'qti',
                        data: itemData
                    },
                    baseUrl: '',
                    state: {}
                }
            }
        }
    }, {
        title: 'itemRef in init',
        fixture: '#fixture-item-2',
        mock: [{
            url: '/init*',
            responseText: {
                success: true,
                itemIdentifier: 'item-2'
            }
        }, {
            url: '/getItem*',
            responseText: {
                success: true,
                content: {
                    type: 'qti',
                    data: itemData
                },
                baseUrl: '',
                state: {}
            }
        }]
    }, {
        title: 'manual load',
        fixture: '#fixture-item-3',
        itemIdentifier: 'item-3',
        mock: [{
            url: '/init*',
            responseText: {
                success: true
            }
        }, {
            url: '/getItem*',
            responseText: {
                success: true,
                content: {
                    type: 'qti',
                    data: itemData
                },
                baseUrl: '',
                state: {}
            }
        }]
    }]).test('render item ', function(data, assert) {
        var ready = assert.async();
        var $container = $(data.fixture);
        var serviceCallId = 'previewer';
        var config = {
            serviceCallId: serviceCallId,
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }]
        };

        assert.expect(1);

        $.mockjax(data.mock);

        previewerFactory(config, $container)
            .on('error', function(err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function(runner) {
                runner
                    .after('renderitem', function() {
                        assert.ok(true, 'The previewer has been rendered');
                        ready();
                    });

                if (data.itemIdentifier) {
                    runner.loadItem(data.itemIdentifier);
                }
            });
    });

    QUnit.test('destroy', function(assert) {
        var ready = assert.async();
        var $container = $('#fixture-destroy');
        var serviceCallId = 'previewer';
        var config = {
            serviceCallId: serviceCallId,
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }]
        };

        assert.expect(2);

        $.mockjax({
            url: '/init*',
            responseText: {
                success: true
            }
        });

        previewerFactory(config, $container)
            .on('error', function(err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function(runner) {
                assert.equal($container.children().length, 1, 'The previewer has been rendered');
                runner.destroy();
            })
            .after('destroy', function() {
                assert.equal($container.children().length, 0, 'The previewer has been destroyed');
                ready();
            });
    });

    QUnit.module('Visual');

    QUnit.test('Visual test', function (assert) {
        var ready = assert.async();
        var $container = $('#visual-test');
        var serviceCallId = 'previewer';
        var itemRef = 'item-1';
        var config = {
            serviceCallId: serviceCallId,
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }],
            plugins: [{
                module: 'taoQtiTestPreviewer/previewer/plugins/controls/close',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'controls'
            },{
                module: 'taoQtiTestPreviewer/previewer/plugins/navigation/submit/submit',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'navigation'
            }, {
                module: 'taoQtiTest/runner/plugins/tools/itemThemeSwitcher/itemThemeSwitcher',
                bundle: 'taoQtiTest/loader/testPlugins.min',
                category: 'tools'
            }, {
                module: 'taoQtiTestPreviewer/previewer/plugins/tools/scale/scale',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'tools'
            }]
        };

        assert.expect(1);

        $.mockjax({
            url: '/init*',
            responseText: {
                success: true
            }
        });
        $.mockjax({
            url: '/getItem*',
            responseText: {
                success: true,
                content: {
                    type: 'qti',
                    data: itemData
                },
                baseUrl: '',
                state: {}
            }
        });
        $.mockjax({
            url: '/submitItem*',
            responseText: {
                success: true,
                displayFeedbacks: false,
                itemSession: {
                    SCORE: {
                        base: {
                            float: 0
                        }
                    }
                }
            }
        });

        previewerFactory(config, $container)
            .on('error', function(err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function(runner) {
                runner
                    .after('renderitem.runnerComponent', function() {
                        assert.ok(true, 'The previewer has been rendered');
                        ready();
                    })
                    .loadItem(itemRef);
            });
    });
});
