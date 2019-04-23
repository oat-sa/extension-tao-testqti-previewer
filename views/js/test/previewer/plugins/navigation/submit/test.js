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
 * Copyright (c) 2019 (original work) Open Assessment Technologies SA ;
 */

/**
 * @author Jean-Sébastien Conan <jean-sebastien@taotesting.com>
 */
define([
    'jquery',
    'lodash',
    'core/promise',
    'ui/hider',
    'taoQtiTestPreviewer/previewer/runner',
    'taoQtiTestPreviewer/previewer/plugins/navigation/submit/submit',
    'json!taoQtiItem/test/samples/json/space-shuttle.json',
    'lib/jquery.mockjax/jquery.mockjax',
    'css!taoQtiTestPreviewer/previewer/provider/item/css/item'
], function (
    $,
    _,
    Promise,
    hider,
    previewerFactory,
    pluginFactory,
    itemData
) {
    'use strict';

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Mock the queries
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

    QUnit.module('API');

    QUnit.test('module', function (assert) {
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
        assert.expect(3);
        previewerFactory(config, $('#fixture-api'))
            .on('ready', function (runner) {
                assert.equal(typeof pluginFactory, 'function', 'The module exposes a function');
                assert.equal(typeof pluginFactory(runner), 'object', 'The factory produces an instance');
                assert.notStrictEqual(pluginFactory(runner), pluginFactory(runner), 'The factory provides a different instance on each call');
                runner.destroy();
            })
            .on('destroy', ready);
    });

    QUnit.cases.init([
        {title: 'init'},
        {title: 'render'},
        {title: 'finish'},
        {title: 'destroy'},
        {title: 'trigger'},
        {title: 'getTestRunner'},
        {title: 'getAreaBroker'},
        {title: 'getConfig'},
        {title: 'setConfig'},
        {title: 'getState'},
        {title: 'setState'},
        {title: 'show'},
        {title: 'hide'},
        {title: 'enable'},
        {title: 'disable'}
    ]).test('plugin API ', function (data, assert) {
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
        assert.expect(1);
        previewerFactory(config, $('#fixture-api'))
            .on('ready', function (runner) {
                var plugin = pluginFactory(runner);
                assert.equal(typeof plugin[data.title], 'function', 'The instances expose a "' + data.title + '" function');
                runner.destroy();
            })
            .on('destroy', ready);
    });

    QUnit.module('UI');

    QUnit.cases.init([{
        title: 'interactive',
        config: {
            readOnly: false
        }
    }, {
        title: 'read only',
        config: {
            readOnly: true
        }
    }]).test('render / destroy ', function (data, assert) {
        var ready = assert.async();
        var config = _.merge({
            serviceCallId: 'foo',
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }],
            plugins: [{
                module: 'taoQtiTestPreviewer/previewer/plugins/navigation/submit/submit',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'navigation'
            }]
        }, data.config);
        assert.expect(8);
        previewerFactory(config, $('#fixture-render'))
            .on('ready', function (runner) {
                var areaBroker = runner.getAreaBroker();
                var plugin = runner.getPlugin('submit');
                Promise.resolve()
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($closer.length, 1, 'The console closer has been inserted');
                        assert.equal($console.length, 1, 'The console has been inserted');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been rendered disabled');
                        assert.equal(hider.isHidden($button), config.readOnly, 'The button state is aligned to the config');
                        return plugin.destroy();
                    })
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        assert.equal($closer.length, 0, 'The console closer has been removed');
                        assert.equal($console.length, 0, 'The console has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, 'Error in init method: ' + err);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.test('enable / disable', function (assert) {
        var ready = assert.async();
        var config = {
            serviceCallId: 'foo',
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }],
            plugins: [{
                module: 'taoQtiTestPreviewer/previewer/plugins/navigation/submit/submit',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'navigation'
            }]
        };
        assert.expect(11);
        previewerFactory(config, $('#fixture-enable'))
            .on('ready', function (runner) {
                var areaBroker = runner.getAreaBroker();
                var plugin = runner.getPlugin('submit');
                Promise.resolve()
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($closer.length, 1, 'The console closer has been inserted');
                        assert.equal($console.length, 1, 'The console has been inserted');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been rendered disabled');
                        return plugin.enable();
                    })
                    .then(function () {
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                        return new Promise(function (resolve) {
                            runner
                                .after('disablenav', resolve)
                                .trigger('disablenav');
                        });
                    })
                    .then(function () {
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been disabled');
                        return new Promise(function (resolve) {
                            runner
                                .after('enablenav', resolve)
                                .trigger('enablenav');
                        });
                    })
                    .then(function () {
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                        return plugin.disable();
                    })
                    .then(function () {
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        assert.equal($button.hasClass('disabled'), true, 'The button has been disabled');
                        return plugin.destroy();
                    })
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        assert.equal($closer.length, 0, 'The console closer has been removed');
                        assert.equal($console.length, 0, 'The console has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, 'Error in init method: ' + err);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.test('show / hide', function (assert) {
        var ready = assert.async();
        var config = {
            serviceCallId: 'foo',
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }],
            plugins: [{
                module: 'taoQtiTestPreviewer/previewer/plugins/navigation/submit/submit',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'navigation'
            }]
        };
        assert.expect(17);
        previewerFactory(config, $('#fixture-show'))
            .on('ready', function (runner) {
                var areaBroker = runner.getAreaBroker();
                var plugin = runner.getPlugin('submit');
                Promise.resolve()
                    .then(function () {
                        return new Promise(function (resolve) {
                            runner
                                .after('renderitem', resolve)
                                .loadItem('item-1');
                        });
                    })
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.equal($closer.length, 1, 'The console closer has been inserted');
                        assert.equal($console.length, 1, 'The console has been inserted');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            var $navigation = areaBroker.getNavigationArea();
                            var $button = $navigation.find('[data-control="submit"]');
                            runner.after('scoreitem', function() {
                                assert.ok('The score is submitted');
                                resolve();
                            });
                            $button.click();
                        });
                    })
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.ok(!hider.isHidden($button), 'The button is visible');
                        assert.ok(!hider.isHidden($closer), 'The console closer is visible');
                        assert.ok(!hider.isHidden($console), 'The console is visible');
                        return plugin.hide();
                    })
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.ok(hider.isHidden($button), 'The button has been hidden');
                        assert.ok(hider.isHidden($closer), 'The console closer has been hidden');
                        assert.ok(hider.isHidden($console), 'The console has been hidden');
                        return plugin.show();
                    })
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.ok(!hider.isHidden($button), 'The button is visible');
                        assert.ok(hider.isHidden($closer), 'The console closer is still hidden');
                        assert.ok(hider.isHidden($console), 'The console is still hidden');
                        return plugin.destroy();
                    })
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        assert.equal($closer.length, 0, 'The console closer has been removed');
                        assert.equal($console.length, 0, 'The console has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, 'Error in init method: ' + err);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

    QUnit.module('behavior');

    QUnit.test('submit', function (assert) {
        var ready = assert.async();
        var config = {
            serviceCallId: 'foo',
            provider: 'qtiItemPreviewer',
            providers: [{
                'id': 'qtiItemPreviewer',
                'module': 'taoQtiTestPreviewer/previewer/provider/item/item',
                'bundle': 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                'category': 'previewer'
            }],
            plugins: [{
                module: 'taoQtiTestPreviewer/previewer/plugins/navigation/submit/submit',
                bundle: 'taoQtiTestPreviewer/loader/qtiPreviewer.min',
                category: 'navigation'
            }]
        };
        assert.expect(14);
        previewerFactory(config, $('#fixture-show'))
            .on('ready', function (runner) {
                var areaBroker = runner.getAreaBroker();
                var plugin = runner.getPlugin('submit');
                Promise.resolve()
                    .then(function () {
                        return new Promise(function (resolve) {
                            runner
                                .after('renderitem', resolve)
                                .loadItem('item-1');
                        });
                    })
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.equal($closer.length, 1, 'The console closer has been inserted');
                        assert.equal($console.length, 1, 'The console has been inserted');
                        assert.equal($button.length, 1, 'The button has been inserted');
                        assert.equal($button.hasClass('disabled'), false, 'The button has been enabled');
                    })
                    .then(function () {
                        return new Promise(function (resolve) {
                            var $navigation = areaBroker.getNavigationArea();
                            var $button = $navigation.find('[data-control="submit"]');
                            runner.after('scoreitem', function() {
                                assert.ok('The score is submitted');
                                resolve();
                            });
                            $button.click();
                        });
                    })
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.ok(!hider.isHidden($button), 'The button is visible');
                        assert.ok(!hider.isHidden($closer), 'The console closer is visible');
                        assert.ok(!hider.isHidden($console), 'The console is visible');
                        $closer.click();
                    })
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.ok(!hider.isHidden($button), 'The button is visible');
                        assert.ok(hider.isHidden($closer), 'The console closer is hidden');
                        assert.ok(hider.isHidden($console), 'The console is hidden');
                        return plugin.destroy();
                    })
                    .then(function () {
                        var $container = areaBroker.getContainer();
                        var $navigation = areaBroker.getNavigationArea();
                        var $button = $navigation.find('[data-control="submit"]');
                        var $closer = $navigation.find('.preview-console-closer');
                        var $console = $container.find('.preview-console');
                        assert.equal($button.length, 0, 'The trigger button has been removed');
                        assert.equal($closer.length, 0, 'The console closer has been removed');
                        assert.equal($console.length, 0, 'The console has been removed');
                        runner.destroy();
                    })
                    .catch(function (err) {
                        assert.ok(false, 'Error in init method: ' + err);
                        runner.destroy();
                    });
            })
            .on('destroy', ready);
    });

});
