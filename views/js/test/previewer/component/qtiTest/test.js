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
    'taoQtiTestPreviewer/previewer/component/test/qtiTest',
    'json!taoQtiTestPreviewer/test/samples/json/configuration.json',
    'json!taoQtiTestPreviewer/test/samples/json/initTestPreview.json',
    'json!taoQtiTestPreviewer/test/samples/json/itemData.json',
    'lib/jquery.mockjax/jquery.mockjax'
], function($, _, qtiTestPreviewerFactory, configuration, initTestPreview, itemData) {
    'use strict';

    QUnit.module('API');

    // Prevent the AJAX mocks to pollute the logs
    $.mockjaxSettings.logger = null;
    $.mockjaxSettings.responseTime = 1;

    // Restore AJAX method after each test
    QUnit.testDone(function() {
        $.mockjax.clear();
    });

    QUnit.test('module', assert =>  {
        const ready = assert.async();

        const previewer1 = qtiTestPreviewerFactory('#fixture-api', configuration.data);
        const previewer2 = qtiTestPreviewerFactory('#fixture-api', configuration.data);

        assert.expect(4);
        $.mockjax({
            url: '*/init',
            responseText: initTestPreview
        });

        $.mockjax({
            url: '*/getItem',
            responseText: itemData
        });
        assert.equal(typeof qtiTestPreviewerFactory, 'function', 'The previewer module exposes a function');
        assert.equal(typeof previewer1, 'object', 'The previewer factory returns an object');
        assert.equal(typeof previewer2, 'object', 'The previewer factory returns an object');
        assert.notEqual(previewer1, previewer2, 'The previewer factory returns a different instance on each call');

        Promise.all([
            new Promise(resolve => previewer1.on('ready', resolve) ),
            new Promise(resolve => previewer2.on('ready', resolve) )
        ]).catch(function(err) {
            assert.pushResult({
                result: false,
                message: err
            });
        }).then( ready );
    });

    QUnit.cases.init([{
        title: 'render test with 1 item',
        mock: [{
            url: '*/init',
            responseText: initTestPreview
        }, {
            url: '*/getItem',
            responseText: itemData
        }]
    }]).test('render test ', (data, assert) =>  {
        const ready = assert.async();
        const $container = $('#fixture-render');

        assert.expect(1);

        $.mockjax(data.mock);

        qtiTestPreviewerFactory($container, configuration.data)
            .on('error', function(err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function(runner) {
                runner.after('renderitem', function() {
                    assert.ok(true, 'The previewer has been rendered');
                    ready();
                });
            });
    });

    QUnit.test('config', assert => {
        const ready = assert.async();
        const config = configuration.data;

        _.assign(config.options, {
            view: 'scorer',
            readOnly: true,
            fullPage: true,
            hideActionBars: true,
        });

        const previewerWithOptions = qtiTestPreviewerFactory('#fixture-api', config);
        const previewerWithoutOptions = qtiTestPreviewerFactory('#fixture-api', configuration.data);

        assert.expect(2);
        $.mockjax({
            url: '*/init',
            responseText: initTestPreview
        });

        $.mockjax({
            url: '*/getItem',
            responseText: itemData
        });

        Promise.all([
            new Promise(resolve => previewerWithOptions.on('ready', runner => resolve(runner))),
            new Promise(resolve => previewerWithoutOptions.on('ready', runner => resolve(runner))),
        ]).catch(function(err) {
            assert.pushResult({
                result: false,
                message: err
            });
        }).then(([runnerWithOptions, runnerWithoutOptions]) => {
            assert.deepEqual(
                runnerWithOptions.getConfig().options,
                config.options,
                'The previewer factory set options using config'
            );
            assert.deepEqual(
                runnerWithoutOptions.getConfig().options,
                configuration.data.options,
                'The previewer factory leave options undefined if config empty'
            );

            ready();
        });
    });

    QUnit.test('destroy', assert =>  {
        const ready = assert.async();
        const $container = $('#fixture-destroy');

        assert.expect(2);

        $.mockjax({
            url: '*/init',
            responseText: initTestPreview
        });

        $.mockjax({
            url: '*/getItem',
            responseText: itemData
        });

        qtiTestPreviewerFactory($container, configuration.data)
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
                runner.after('renderitem', function() {
                    runner.destroy();
                });
            })
            .after('destroy', function() {
                assert.equal($container.children().length, 0, 'The previewer has been destroyed');
                ready();
            });
    });
    QUnit.module('Visual');

    QUnit.test('Visual test', function (assert) {
        const ready = assert.async();
        const $container = $('#visual-test');

        assert.expect(1);

        $.mockjax({
            url: '*/init',
            responseText: initTestPreview
        });

        $.mockjax({
            url: '*/getItem',
            responseText: itemData
        });

        qtiTestPreviewerFactory($container, configuration.data)
            .on('error', function(err) {
                assert.ok(false, 'An error has occurred');
                assert.pushResult({
                    result: false,
                    message: err
                });
                ready();
            })
            .on('ready', function(runner) {
                runner.after('renderitem.runnerComponent', function() {
                    assert.ok(true, 'The previewer has been rendered');
                    ready();
                });
            });
    });
});
