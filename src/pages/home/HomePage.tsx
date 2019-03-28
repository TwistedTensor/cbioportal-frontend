import * as React from 'react';
import * as _ from 'lodash';
import {If, Then, Else} from 'react-if';
import {observer, inject, Observer } from "mobx-react";
import { observable } from 'mobx';
import Chart from 'chart.js';
import AppConfig from 'appConfig';
import 'react-select/dist/react-select.css';
import {CancerStudyQueryUrlParams, QueryStore} from "../../shared/components/query/QueryStore";
import QueryAndDownloadTabs from "../../shared/components/query/QueryAndDownloadTabs";
import {PageLayout} from "../../shared/components/PageLayout/PageLayout";
import RightBar from "../../shared/components/rightbar/RightBar";
import getBrowserWindow from "../../shared/lib/getBrowserWindow";
// tslint:disable-next-line:no-import-side-effect
import "./homePage.scss";
import autobind from "autobind-decorator";

(Chart as any).plugins.register({
    beforeDraw: function (chartInstance: any) {
        const ctx = chartInstance.chart.ctx;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, chartInstance.chart.width, chartInstance.chart.height);
    }
});

const win = (window as any);

export interface IResultsViewPageProps {
    routing: any;
}

export function createQueryStore(currentQuery?:any) {

    const win:any = window;

    const queryStore = new QueryStore(currentQuery);
    
    queryStore.singlePageAppSubmitRoutine = function(query:CancerStudyQueryUrlParams) {

        // normalize this
        query.cancer_study_list = query.cancer_study_list || query.cancer_study_id;
        delete query.cancer_study_id;

        win.routingStore.updateRoute(query, "results", true);

    };

    return queryStore;

}

@inject('routing')
@observer
export default class HomePage extends React.Component<IResultsViewPageProps, {}> {

    @observable showQuerySelector = true;

    queryStore:QueryStore;

    constructor(props: IResultsViewPageProps) {
        super(props);
    }

    componentWillMount(){
        this.queryStore = createQueryStore();
    }

    private handleTabChange(id: string) {
        this.props.routing.updateRoute({ tab: id });
    }

    @autobind
    private getQueryStore(){
        return this.queryStore;
    }

    public render() {

        return (
            <PageLayout className="homePageLayout" noMargin={true} rightBar={<RightBar queryStore={this.queryStore} />}>

                <div className={"skinBlurb"} dangerouslySetInnerHTML={{__html:AppConfig.serverConfig.skin_blurb!}}></div>
                <QueryAndDownloadTabs getQueryStore={this.getQueryStore} showQuickSearchTab={AppConfig.serverConfig.quick_search_enabled} showDownloadTab={true}/>

            </PageLayout>
        )

    }
}