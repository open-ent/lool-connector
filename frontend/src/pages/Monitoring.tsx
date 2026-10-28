import { AppHeader, Card, Grid, LoadingScreen } from "@open-ent/react";
import { useTranslation } from "react-i18next";
import { ExtensionDonut } from "../components/ExtensionDonut";
import { groupExtensions } from "../services/api/monitoring.service";
import {
  useEventCount,
  useExtensions,
  useOpenedDocuments,
  useUserCount,
} from "../services/queries/monitoring.query";

/** Tableau de bord d'administration : activité des éditeurs de documents (réservé au droit « monitoring »). */
export const Monitoring = () => {
  const { t } = useTranslation("lool");
  const users = useUserCount();
  const access = useEventCount("ACCESS");
  const versions = useEventCount("NEW_VERSION");
  const documents = useOpenedDocuments();
  const extensions = useExtensions();

  const counters = [
    { key: "users", label: t("lool.connected.users"), query: users },
    { key: "access", label: t("lool.connexions.total"), query: access },
    { key: "versions", label: t("lool.versions.total"), query: versions },
  ];
  const failed = [users, access, versions, documents, extensions].some((q) => q.isError);
  const loading = [users, access, versions, documents, extensions].some((q) => q.isLoading);

  if (loading) return <LoadingScreen />;

  return (
    <>
      <AppHeader>
        <h1 className="h2">{t("lool.title")}</h1>
      </AppHeader>
      {failed && (
        <div className="alert alert-danger" role="alert" data-monitoring-error>
          {t("lool.monitoring.error")}
        </div>
      )}
      <Grid>
        {counters.map(({ key, label, query }) => (
          <Grid.Col key={key} sm="4" md="4" xl="4">
            <Card>
              <Card.Body>
                <div data-monitoring-counter={key}>
                  <h4 className="text-center">{label}</h4>
                  <div className="text-center" style={{ fontSize: 52, lineHeight: "52px" }}>
                    {query.isError ? "–" : (query.data ?? 0)}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Grid.Col>
        ))}
        <Grid.Col sm="4" md="4" xl="4">
          <Card>
            <Card.Body>
              <div className="w-100">
                <h4>{t("lool.extensions.groups")}</h4>
                <ExtensionDonut
                  slices={groupExtensions(extensions.data ?? [])}
                  otherLabel={t("lool.other")}
                />
              </div>
            </Card.Body>
          </Card>
        </Grid.Col>
        <Grid.Col sm="8" md="8" xl="8">
          <Card>
            <Card.Body>
              <div className="w-100">
                <h4>{t("lool.opened.files")}</h4>
                <table className="table w-100" data-opened-documents>
                  <thead>
                    <tr>
                      <th>{t("lool.file")}</th>
                      <th>{t("lool.user.number")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(documents.data ?? []).map((d) => (
                      <tr key={d._id}>
                        <td>{d.filename}</td>
                        <td>{d.users}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card.Body>
          </Card>
        </Grid.Col>
      </Grid>
    </>
  );
};
