/*
 * Kimios - Document Management System Software
 * Copyright (C) 2012-2013  DevLib'
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 2 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
kimios.tasks.BonitaAssignedTasksPanel = Ext.extend(Ext.grid.GridPanel, {

    constructor: function (config) {
        this.tasksCounter = 0;
        this.pageSize = 10;
        this.id = 'kimios-assigned-tasks-panel';
        this.title = kimios.lang('BonitaAssignedTasks');
        this.hideHeaders = true;
        this.store = kimios.store.TasksStore.getBonitaAssignedTasksStore(false, this.pageSize);
        this.viewConfig = {
            forceFit: true,
            scrollOffset: 0
        };
        this.columnLines = false;
        this.sm = new Ext.grid.RowSelectionModel({singleSelect: true});
        this.pagingToolBar = new Ext.PagingToolbar({
            id: 'kimios-assigned-tasks-panel-pbar',
            store: this.store,
            displayInfo: true,
            pageSize: this.pageSize,
            displayMsg: '',
            emptyMsg: '',
            prependButtons: true
        });
        this.pagingToolBar.refresh.hideParent = true;
        this.pagingToolBar.refresh.hide();

        this.tbar = [
            this.pagingToolBar
        ];
        this.bonitaError = false;

        this.cm = new Ext.grid.ColumnModel([

            {
                align: 'center',
                readOnly: true,
                width: 16,
                hidden: false,
                sortable: false,
                hideable: false,
                fixed: true,
                resizable: false,
                menuDisabled: true,
                renderer: function (val, metaData, record, rowIndex, colIndex, store) {
                    if (record.data.state == 'failed') {
                        metaData.css = 'reject-status';
                    }
                    else {
                        metaData.css = 'accept-status';
                    }

                }
            },
            {
                sortable: false,
                menuDisabled: true,
                align: 'left',
                flex: 1,
                dataIndex: 'name',
                renderer: function (value, meta, record) {
                    var state = record.data.state;
                    var date = kimios.date(record.data.expectedEndDate);
                    var apps = record.data.processWrapper.name;
                    var desc = record.data.description;

                    var html = value + '<span style="font-size:.9em;color:gray;"> -- ' + apps + '</span>';
                    html += '<br/><span style="font-size:.9em;color:gray;">' + date + '</span>';
                    html += '<br/><span style="font-size:.8em;">' + state.toUpperCase() + '</span>';

                    return html;
                }
            }
        ]);

        kimios.tasks.BonitaAssignedTasksPanel.superclass.constructor.call(this, config);
    },

    initComponent: function () {
        kimios.tasks.BonitaAssignedTasksPanel.superclass.initComponent.apply(this, arguments);

        this.store.on('beforeload', function (store, records, options) {
            kimios.explorer.getToolbar().myTasksButton.setIconClass('loading');
            Ext.getCmp('bonitaTabPanelId').setIconClass('loading');
        }, this);

        this.store.on('exception', function () {
            Ext.getCmp('kimios-viewport').bonita = false;
            this.bonitaError = true;

            this.tasksCounter = '?';

            if (Ext.getCmp('kimios-tasks-panel').bonitaError) {

                kimios.explorer.getToolbar().myTasksButton.setText('<span style="color:gray;text-decoration: line-through;">' + kimios.lang('MyTasks') + '</span>');

                if (Ext.getCmp('kimios-viewport').bonita == false && Ext.getCmp('kimios-viewport').bonitaAlreadyCheck == false) {
                    /*Ext.Msg.show({
                        title: 'Bonita Service',
                        msg: kimios.lang('BonitaUnvailable'),
                        buttons: Ext.Msg.OK,
                        icon: Ext.MessageBox.WARNING
                    });*/
                    Ext.getCmp('kimios-viewport').bonitaAlreadyCheck = true;
                }
            } else {
                kimios.explorer.getToolbar().myTasksButton.setText(kimios.lang('MyTasks') + ' (?)');
            }
            Ext.getCmp('kimios-assigned-tasks-panel').getStore().removeAll();
            Ext.getCmp('kimios-assigned-tasks-panel').setTitle('<span style="color:gray;text-decoration: line-through;">' + kimios.lang('BonitaAssignedTasks') + '</span>');
            Ext.getCmp('bonitaTabPanelId').setIconClass(undefined);
            Ext.getCmp('bonitaTabPanelId').refresh(Ext.getCmp('kimios-tasks-panel').tasksCounter, '?');
            kimios.explorer.getToolbar().myTasksButton.setIconClass('tasks');
        }, this);

        this.store.on('load', function (store, records, options) {
            Ext.getCmp('kimios-viewport').bonita = true;
            Ext.getCmp('kimios-viewport').bonitaAlreadyCheck = false;
            this.bonitaError = false;

            this.tasksCounter = store.totalLength;

            this.setTitle(kimios.lang('BonitaAssignedTasks') + ' ' + (this.tasksCounter > 0 ? '(' + this.tasksCounter + ')' : ''));

            Ext.getCmp('bonitaTabPanelId').refresh(undefined, this.tasksCounter);
            Ext.getCmp('bonitaTabPanelId').setIconClass(undefined);

            kimios.explorer.getToolbar().myTasksButton.refresh(Ext.getCmp('kimios-tasks-panel').tasksCounter, this.tasksCounter);
            kimios.explorer.getToolbar().myTasksButton.setIconClass('tasks');

            if (records.length == 0 && this.tasksCounter > 0) {
                Ext.getCmp('kimios-assigned-tasks-panel-pbar').moveLast();
            }

            Ext.getCmp('bonitaTabPanelId').setDisabled(false);
            kimios.explorer.getToolbar().doLayout(); // My Tasks button GUI fix
        }, this);


        this.on('rowdblclick', function (grid, rowIndex, e) {
            var pojo = grid.getSelectionModel().getSelected().data;
            this.getTaskWindow(pojo, false, true).show();
        }, this);

        this.on('rowcontextmenu', function (grid, rowIndex, e) {
            e.preventDefault();
            var sm = this.getSelectionModel();
            sm.selectRow(rowIndex);
            var selectedRecord = sm.getSelected();
            kimios.ContextMenu.show(selectedRecord.data, e, 'myBonitaAssignedTasks');
        });

        this.on('containercontextmenu', function (grid, e) {
            e.preventDefault();
            kimios.ContextMenu.show(new kimios.DMEntityPojo({}), e, 'myBonitaAssignedTasksContainer');
        }, this);
    },

    refresh: function () {
        this.store.reload({
            scope: this
        });
    },

    refreshLanguage: function () {
        var newTitle = kimios.lang('BonitaAssignedTasks') + ' ' + (this.tasksCounter > 0 ? '(' + this.tasksCounter + ')' : '');
        this.setTitle(newTitle);
//        kimios.explorer.getToolbar().myAssignedTasksButton.setText(newTitle);
        this.refresh();
        this.doLayout();
    },

    getTaskWindow: function (myTask, withPending, withAssigned) {
        if (Ext.getCmp('propInstancesPanelId')) {
            Ext.getCmp('propInstancesPanelId').getSelectionModel().clearSelections(false);
        }
        if (Ext.getCmp('propTasksPanelId')) {
            Ext.getCmp('propTasksPanelId').getStore().removeAll();
        }
        var task = null;
        var process = null;
        var comments = null;
        var actor = null;
        var assignee = null;

        if (myTask == undefined) {
            task = this.dmEntityPojo;
            process = this.dmEntityPojo.processWrapper;
            comments = this.dmEntityPojo.commentWrappers;
            actor = this.dmEntityPojo.actor;
            assignee = this.dmEntityPojo.assignee;
        } else {
            task = myTask;
            process = myTask.processWrapper;
            comments = myTask.commentWrappers;
            actor = myTask.actor;
            assignee = myTask.assignee;
        }

        /* task fields */

        this.assignedToField = new Ext.form.DisplayField({
            name: 'apps',
            anchor: '100%',
            fieldLabel: 'Assigned to',
            value: assignee ? assignee.userName : undefined,
            hidden: assignee ? false : true
        });

        this.appsField = new Ext.form.DisplayField({
            name: 'apps',
            anchor: '100%',
            fieldLabel: 'Apps',
            value: process.name
        });

        this.versionField = new Ext.form.DisplayField({
            name: 'apps',
            anchor: '100%',
            fieldLabel: 'Apps version',
            value: process.version
        });

        this.caseField = new Ext.form.DisplayField({
            name: 'apps',
            anchor: '100%',
            fieldLabel: 'Case',
            value: task.rootContainerId
        });

        this.stateField = new Ext.form.DisplayField({
            name: 'apps',
            anchor: '100%',
            fieldLabel: 'State',
            value: task.state == 'failed' ? kimios.lang('BonitaTaskFailed') : kimios.lang('BonitaTaskReady')
        });

        this.priorityField = new Ext.form.DisplayField({
            anchor: '100%',
            fieldLabel: 'Priority',
            value: task.priority
        });

        this.expectedEndDateField = new Ext.form.DisplayField({
            anchor: '100%',
            fieldLabel: 'Due date',
            value: task.expectedEndDate > 0 ? kimios.date(task.expectedEndDate) : ''
        });

        this.lastUpdateDateField = new Ext.form.DisplayField({
            anchor: '100%',
            fieldLabel: 'Last update date',
            value: task.lastUpdateDate > 0 ? kimios.date(task.lastUpdateDate) : ''
        });

        this.claimedField = new Ext.form.DisplayField({
            anchor: '100%',
            fieldLabel: 'Claimed date',
            value: task.claimedDate > 0 ? kimios.date(task.claimedDate) : ''
        });

        this.reachedStateField = new Ext.form.DisplayField({
            anchor: '100%',
            fieldLabel: 'Reached state date',
            value: task.reachedStateDate > 0 ? kimios.date(task.reachedStateDate) : ''
        });

        this.descriptionField = new Ext.form.DisplayField({
            anchor: '100%',
            fieldLabel: 'Description',
            value: task.description ? task.description : 'No description'
        });

        return new Ext.Window({
            id: 'BonitaAssignedTaskWindowID',
            width: 640,
            height: 460,
            layout: 'border',
            border: true,
            title: task.name,
            iconCls: 'accept-status',
            maximizable: true,
            modal: true,
            items: [
                new kimios.FormPanel({
                    bodyStyle: 'padding:10px;background-color:transparent;',
                    autoScroll: true,
                    labelWidth: 140,
                    border: false,
                    width: 315,
                    region: 'west',
                    defaults: {
                        style: 'font-size: 11px',
                        labelStyle: 'font-size: 11px;font-weight:bold;'
                    },
                    items: [
                        new Ext.form.FieldSet({
                            title: 'Task Details',
                            layout: 'form',
                            collapsible: true,
                            defaults: {
                                style: 'font-size: 11px',
                                labelStyle: 'font-size: 11px;font-weight:bold;'
                            },
                            bodyStyle: 'padding:3px;background-color:transparent;',
                            items: [
                                this.assignedToField,
                                this.appsField,
                                this.versionField,
                                this.caseField,
                                this.stateField,
                                this.priorityField,
                                this.descriptionField
                            ]
                        }),
                        new Ext.form.FieldSet({
                            title: 'Task Dates',
                            layout: 'form',
                            collapsible: true,
                            defaults: {
                                style: 'font-size: 11px',
                                labelStyle: 'font-size: 11px;font-weight:bold;'
                            },
                            bodyStyle: 'padding:3px;background-color:transparent;',
                            items: [
                                this.expectedEndDateField,
                                this.lastUpdateDateField,
                                this.claimedField,
                                this.reachedStateField
                            ]
                        })
                    ]
                }),
                new kimios.tasks.CommentsPanel({
                    frame: true,
                    title: kimios.lang('Comments'),
                    taskId: task.id,
                    comments: comments,
                    bodyStyle: 'background-color:transparent;',
                    border: false,
                    region: 'center'
                })

            ],
            fbar: [
                {
                    text: kimios.lang('BonitaDoIt'),
                    iconCls: 'studio-cls-wf',
                    handler: function () {
                        Ext.getCmp('BonitaAssignedTaskWindowID').close();

                        var url = task.url;

                        var iframe = new Ext.Window({
                            width: 640,
                            height: 460,
                            layout: 'fit',
                            title: task.name,
                            iconCls: 'accept-status',
                            maximizable: true,
                            closable: false,
                            modal: true,
                            autoScroll: true,
                            items: [
                                {
                                    html: '<iframe id="reportframe" border="0" width="100%" height="100%" ' +
                                        'frameborder="0" marginheight="12" marginwidth="16" scrolling="auto" ' +
                                        'src="' + url + '"></iframe>'
                                }
                            ],
                            fbar: [
                                {
                                    text: kimios.lang('Close'),
                                    handler: function () {
                                        iframe.close();
                                        Ext.getCmp('kimios-tasks-panel').refresh();
                                        Ext.getCmp('kimios-assigned-tasks-panel').refresh();
                                        if (Ext.getCmp('propInstancesPanelId')) {
                                            Ext.getCmp('propInstancesPanelId').getSelectionModel().clearSelections(false);
                                        }
                                        if (Ext.getCmp('propTasksPanelId')) {
                                            Ext.getCmp('propTasksPanelId').getStore().removeAll();
                                        }
                                    }
                                }
                            ]
                        }).show();
                    }
                },
                {
                    text: kimios.lang('BonitaTake'),
                    iconCls: 'studio-cls-wf-down',
                    hidden: withPending ? false : true,
                    handler: function () {
                        kimios.ajaxRequest('Workflow', {
                                action: 'takeTask',
                                taskId: task.id
                            },
                            function () {
                                Ext.getCmp('kimios-tasks-panel').refresh();
                                Ext.getCmp('kimios-assigned-tasks-panel').refresh();
                            }
                        );
                        Ext.getCmp('BonitaAssignedTaskWindowID').close();
                    }
                },


                {
                    text: kimios.lang('BonitaRelease'),
                    iconCls: 'studio-wf-expand',
                    hidden: withAssigned ? false : true,
                    handler: function () {
                        kimios.ajaxRequest('Workflow', {
                                action: 'releaseTask',
                                taskId: task.id
                            },
                            function () {
                                Ext.getCmp('kimios-tasks-panel').refresh();
                                Ext.getCmp('kimios-assigned-tasks-panel').refresh();
                            }
                        );
                        Ext.getCmp('BonitaAssignedTaskWindowID').close();
                    }
                },

                {
                    text: kimios.lang('BonitaHide'),
                    iconCls: 'delete',
                    hidden: withPending ? false : true,
                    handler: function () {
                        kimios.ajaxRequest('Workflow', {
                                action: 'hideTask',
                                taskId: task.id
                            },
                            function () {
                                Ext.getCmp('kimios-tasks-panel').refresh();
                                Ext.getCmp('kimios-assigned-tasks-panel').refresh();
                            }
                        );
                        Ext.getCmp('BonitaAssignedTaskWindowID').close();
                    }
                },

                {
                    text: kimios.lang('Close'),
                    handler: function () {
                        Ext.getCmp('BonitaAssignedTaskWindowID').close();

                    }
                }
            ]
        });
    }
})
;
